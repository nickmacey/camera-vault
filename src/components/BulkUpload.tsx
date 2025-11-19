import { useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { 
  FolderOpen, 
  Play, 
  Pause, 
  StopCircle, 
  CheckCircle2, 
  AlertCircle,
  Image as ImageIcon,
  Clock,
  TrendingUp,
  Search,
  FileCheck,
  Minimize2
} from 'lucide-react';
import { AnimatedLockIcon } from './AnimatedLockIcon';
import { useUpload } from '@/contexts/UploadContext';
import { generateFileHash, checkDuplicateHash } from '@/lib/fileHash';

interface UploadStats {
  total: number;
  processed: number;
  successful: number;
  failed: number;
  skipped: number;
  vaultWorthy: number;
  highValue: number;
  archive: number;
  currentFile: string;
  startTime: number;
  errors: Array<{ filename: string; error: string }>;
}

interface FilterOptions {
  skipSmallFiles: boolean;
  minFileSize: number;
  skipScreenshots: boolean;
  skipExisting: boolean;
}

interface ScanResults {
  totalFiles: number;
  totalSize: number;
  duplicates: number;
  screenshots: number;
  smallFiles: number;
  validFiles: number;
  estimatedCost: number;
  estimatedTime: number;
}

type UploadStatus = 'idle' | 'scanning' | 'scanned' | 'running' | 'paused' | 'complete' | 'cancelled';

export function BulkUpload() {
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [stats, setStats] = useState<UploadStats>({
    total: 0,
    processed: 0,
    successful: 0,
    failed: 0,
    skipped: 0,
    vaultWorthy: 0,
    highValue: 0,
    archive: 0,
    currentFile: '',
    startTime: 0,
    errors: []
  });
  const [filters, setFilters] = useState<FilterOptions>({
    skipSmallFiles: true,
    minFileSize: 100,
    skipScreenshots: true,
    skipExisting: true
  });
  const [scanResults, setScanResults] = useState<ScanResults | null>(null);
  
  const folderInputRef = useRef<HTMLInputElement>(null);
  const shouldPauseRef = useRef(false);
  const { toast } = useToast();
  const { startUpload: startUploadContext, updateStats: updateUploadStats, setMinimized } = useUpload();

  const handleFolderSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const imageFiles = selectedFiles.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length === 0) {
      toast({
        title: "No images found",
        description: "Please select a folder containing image files",
        variant: "destructive"
      });
      return;
    }
    
    setFiles(imageFiles);
    setScanResults(null);
    setStats({
      total: imageFiles.length,
      processed: 0,
      successful: 0,
      failed: 0,
      skipped: 0,
      vaultWorthy: 0,
      highValue: 0,
      archive: 0,
      currentFile: '',
      startTime: 0,
      errors: []
    });
    
    toast({
      title: "Folder loaded",
      description: `${imageFiles.length} images ready to scan`
    });
  }, [toast]);

  const scanFolder = async () => {
    if (files.length === 0) return;

    setStatus('scanning');
    
    let totalSize = 0;
    let duplicates = 0;
    let screenshots = 0;
    let smallFiles = 0;
    
    const { data: { user } } = await supabase.auth.getUser();
    
    for (const file of files) {
      totalSize += file.size;
      
      if (filters.skipSmallFiles && file.size < filters.minFileSize * 1024) {
        smallFiles++;
        continue;
      }
      
      if (filters.skipScreenshots && 
          (file.name.toLowerCase().includes('screenshot') || 
           file.name.toLowerCase().includes('screen shot') ||
           file.name.toLowerCase().includes('screen_shot'))) {
        screenshots++;
        continue;
      }
      
      if (filters.skipExisting && user) {
        const fileHash = await generateFileHash(file);
        const { isDuplicate } = await checkDuplicateHash(supabase, user.id, fileHash);
        if (isDuplicate) {
          duplicates++;
        }
      }
    }
    
    const validFiles = files.length - duplicates - screenshots - smallFiles;
    const estimatedCost = validFiles * 0.002;
    const estimatedTime = Math.ceil((validFiles * 3) / 60); // minutes
    
    const results: ScanResults = {
      totalFiles: files.length,
      totalSize,
      duplicates,
      screenshots,
      smallFiles,
      validFiles,
      estimatedCost,
      estimatedTime
    };
    
    setScanResults(results);
    setStatus('scanned');
    
    toast({
      title: "Scan complete",
      description: `${validFiles} files ready to upload`
    });
  };

  const checkFileExists = async (file: File): Promise<boolean> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const fileHash = await generateFileHash(file);
    const { isDuplicate } = await checkDuplicateHash(supabase, user.id, fileHash);
    return isDuplicate;
  };

  const processFile = async (file: File): Promise<'success' | 'skipped' | 'failed'> => {
    try {
      // Apply filters
      if (filters.skipSmallFiles && file.size < filters.minFileSize * 1024) {
        return 'skipped';
      }

      if (filters.skipScreenshots && 
          (file.name.toLowerCase().includes('screenshot') || 
           file.name.toLowerCase().includes('screen shot') ||
           file.name.toLowerCase().includes('screen_shot'))) {
        return 'skipped';
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Generate file hash for duplicate detection
      const fileHash = await generateFileHash(file);
      
      if (filters.skipExisting) {
        const { isDuplicate } = await checkDuplicateHash(supabase, user.id, fileHash);
        if (isDuplicate) return 'skipped';
      }

      // Get user settings
      const { data: settings } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      const userSettings = settings || {
        technical_weight: 70,
        commercial_weight: 80,
        artistic_weight: 60,
        emotional_weight: 50
      };

      // Upload to storage
      const filePath = `${user.id}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('photos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('photos')
        .getPublicUrl(filePath);

      // Convert to base64 for analysis
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve) => {
        reader.onloadend = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1]);
        };
        reader.readAsDataURL(file);
      });

      // Analyze photo using Claude
      const { data: analysisData, error: analysisError } = await supabase.functions.invoke('analyze-photo-claude', {
        body: { 
          imageBase64: base64,
          userSettings: {
            technical_weight: userSettings.technical_weight,
            commercial_weight: userSettings.commercial_weight,
            artistic_weight: userSettings.artistic_weight,
            emotional_weight: userSettings.emotional_weight
          }
        }
      });

      if (analysisError) {
        console.error('Analysis error:', analysisError);
        throw new Error(`Analysis failed: ${analysisError.message || 'Edge Function returned a non-2xx status code'}`);
      }

      if (!analysisData || typeof analysisData.overall_score !== 'number') {
        throw new Error('Invalid analysis response');
      }

      // Get image dimensions
      const img = new Image();
      const dimensions = await new Promise<{width: number, height: number}>((resolve, reject) => {
        img.onload = () => resolve({ width: img.width, height: img.height });
        img.onerror = reject;
        img.src = URL.createObjectURL(file);
      });

      const orientation = dimensions.width > dimensions.height ? 'landscape'
                        : dimensions.width < dimensions.height ? 'portrait'
                        : 'square';

      // Get analysis results from Claude
      const overallScore = analysisData.overall_score;
      const technicalScore = analysisData.technical_score;
      const commercialScore = analysisData.commercial_score;
      const artisticScore = analysisData.artistic_score;
      const emotionalScore = analysisData.emotional_score;
      const tier = analysisData.tier;
      const aiAnalysis = analysisData.ai_analysis || '';
      const suggestedName = file.name.replace(/\.[^/.]+$/, '');

      // Save to database
      const { error: dbError } = await supabase
        .from('photos')
        .insert({
          user_id: user.id,
          provider: 'manual_upload',
          storage_path: filePath,
          filename: suggestedName,
          mime_type: file.type,
          file_size: file.size,
          file_hash: fileHash,
          width: dimensions.width,
          height: dimensions.height,
          orientation,
          overall_score: overallScore,
          technical_score: technicalScore,
          commercial_score: commercialScore,
          artistic_score: artisticScore,
          emotional_score: emotionalScore,
          tier: tier,
          ai_analysis: aiAnalysis,
          status: 'new',
          analyzed_at: new Date().toISOString()
        });

      if (dbError) throw dbError;

      // Update tier stats based on tier from analysis
      setStats(prev => {
        const tierKey = tier === 'vault-worthy' ? 'vaultWorthy' : tier === 'high-value' ? 'highValue' : 'archive';
        return {
          ...prev,
          [tierKey]: prev[tierKey] + 1
        };
      });

      return 'success';

    } catch (error: any) {
      console.error('File processing error:', error);
      setStats(prev => ({
        ...prev,
        errors: [...prev.errors, { filename: file.name, error: error.message }]
      }));
      return 'failed';
    }
  };

  const startUpload = async () => {
    if (files.length === 0) {
      toast({
        title: "No files selected",
        description: "Please select a folder first",
        variant: "destructive"
      });
      return;
    }

    setStatus('running');
    shouldPauseRef.current = false;
    const startTime = Date.now();
    setStats(prev => ({ ...prev, startTime }));
    
    // Initialize global upload context
    startUploadContext(files.length);

    const batchSize = 5;
    
    for (let i = 0; i < files.length; i += batchSize) {
      if (shouldPauseRef.current) {
        setStatus('paused');
        return;
      }

      const batch = files.slice(i, i + batchSize);
      
      await Promise.all(
        batch.map(async (file) => {
          const currentFile = file.name;
          setStats(prev => ({ ...prev, currentFile }));
          updateUploadStats({ currentFile }); // Sync to global context
          
          const result = await processFile(file);
          
          setStats(prev => {
            const newStats = {
              ...prev,
              processed: prev.processed + 1,
              successful: result === 'success' ? prev.successful + 1 : prev.successful,
              skipped: result === 'skipped' ? prev.skipped + 1 : prev.skipped,
              failed: result === 'failed' ? prev.failed + 1 : prev.failed
            };
            
            // Sync to global context
            updateUploadStats({
              processed: newStats.processed,
              successful: newStats.successful,
              failed: newStats.failed,
              vaultWorthy: newStats.vaultWorthy,
              currentFile: newStats.currentFile,
              startTime: newStats.startTime
            });
            
            return newStats;
          });
        })
      );

      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    setStatus('complete');
    setStats(prev => ({ ...prev, currentFile: '' }));
    
    toast({
      title: "Upload complete!",
      description: `${stats.successful} photos analyzed and added to your vault`
    });
  };

  const pauseUpload = () => {
    shouldPauseRef.current = true;
  };

  const resumeUpload = () => {
    const remainingFiles = files.slice(stats.processed);
    setFiles(remainingFiles);
    setStats(prev => ({ 
      ...prev, 
      total: remainingFiles.length, 
      processed: 0,
      successful: 0,
      failed: 0,
      skipped: 0
    }));
    startUpload();
  };

  const cancelUpload = () => {
    shouldPauseRef.current = true;
    setStatus('cancelled');
    setFiles([]);
  };

  const resetUpload = () => {
    setFiles([]);
    setScanResults(null);
    setStatus('idle');
    setStats({
      total: 0,
      processed: 0,
      successful: 0,
      failed: 0,
      skipped: 0,
      vaultWorthy: 0,
      highValue: 0,
      archive: 0,
      currentFile: '',
      startTime: 0,
      errors: []
    });
  };

  const progress = stats.total > 0 ? (stats.processed / stats.total) * 100 : 0;

  const getTimeRemaining = () => {
    if (stats.processed === 0 || stats.startTime === 0) return 'Calculating...';
    
    const elapsed = Date.now() - stats.startTime;
    const rate = stats.processed / (elapsed / 1000);
    const remaining = stats.total - stats.processed;
    const secondsRemaining = remaining / rate;
    
    const hours = Math.floor(secondsRemaining / 3600);
    const minutes = Math.floor((secondsRemaining % 3600) / 60);
    
    if (hours > 0) return `~${hours}h ${minutes}m`;
    if (minutes > 0) return `~${minutes}m`;
    return '< 1m';
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-vault-platinum mb-2">
          Bulk Upload
        </h2>
        <p className="text-vault-light-gray">
          Upload entire folders from Google Takeout or local storage
        </p>
      </div>

      {status === 'idle' && (
        <Card className="p-8 border-vault-mid-gray bg-card">
          <div className="text-center space-y-6">
            <div className="mx-auto w-20 h-20 rounded-full bg-vault-gold/10 flex items-center justify-center">
              <FolderOpen className="h-10 w-10 text-vault-gold" />
            </div>
            
            <div>
              <h3 className="text-xl font-bold text-vault-platinum mb-2">
                Select Your Photo Folder
              </h3>
              <p className="text-vault-light-gray">
                Choose a folder containing your photos from Google Takeout or any source
              </p>
            </div>

            <input
              ref={folderInputRef}
              type="file"
              webkitdirectory=""
              directory=""
              multiple
              onChange={handleFolderSelect}
              className="hidden"
              accept="image/*"
            />

            <Button
              onClick={() => folderInputRef.current?.click()}
              size="lg"
              className="bg-vault-gold hover:bg-[#C4A037] text-background px-8"
            >
              <FolderOpen className="mr-2 h-5 w-5" />
              Choose Folder
            </Button>

            <div className="border-t border-vault-mid-gray pt-6 mt-6">
              <h4 className="text-sm font-bold text-vault-platinum uppercase mb-4">
                Upload Options
              </h4>
              
              <div className="space-y-3 text-left max-w-md mx-auto">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="skip-small"
                    checked={filters.skipSmallFiles}
                    onCheckedChange={(checked) =>
                      setFilters({ ...filters, skipSmallFiles: checked as boolean })
                    }
                  />
                  <Label htmlFor="skip-small" className="text-vault-platinum cursor-pointer text-sm">
                    Skip files under 100KB (likely low quality)
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="skip-screenshots"
                    checked={filters.skipScreenshots}
                    onCheckedChange={(checked) =>
                      setFilters({ ...filters, skipScreenshots: checked as boolean })
                    }
                  />
                  <Label htmlFor="skip-screenshots" className="text-vault-platinum cursor-pointer text-sm">
                    Skip screenshots
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="skip-existing"
                    checked={filters.skipExisting}
                    onCheckedChange={(checked) =>
                      setFilters({ ...filters, skipExisting: checked as boolean })
                    }
                  />
                  <Label htmlFor="skip-existing" className="text-vault-platinum cursor-pointer text-sm">
                    Skip duplicates (already in vault)
                  </Label>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {files.length > 0 && status === 'idle' && (
        <Card className="p-6 border-vault-mid-gray bg-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold text-vault-platinum">
                {files.length} photos ready
              </h3>
              <p className="text-sm text-vault-light-gray">
                Scan folder to preview what will be uploaded
              </p>
            </div>
            <Button
              onClick={resetUpload}
              variant="outline"
              size="sm"
            >
              Choose Different Folder
            </Button>
          </div>

          <Button
            onClick={scanFolder}
            size="lg"
            className="w-full bg-vault-gold hover:bg-[#C4A037] text-background"
          >
            <Search className="mr-2 h-5 w-5" />
            Scan Folder (Dry Run)
          </Button>
        </Card>
      )}

      {status === 'scanning' && (
        <Card className="p-8 border-vault-mid-gray bg-card">
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-vault-gold/10 flex items-center justify-center">
              <Search className="h-8 w-8 text-vault-gold animate-pulse" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-vault-platinum mb-2">
                Scanning Folder...
              </h3>
              <p className="text-vault-light-gray">
                Checking for duplicates and applying filters
              </p>
            </div>
          </div>
        </Card>
      )}

      {status === 'scanned' && scanResults && (
        <Card className="p-6 border-vault-gold bg-card">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-vault-platinum flex items-center gap-2">
                  <FileCheck className="h-6 w-6 text-vault-gold" />
                  Scan Complete
                </h3>
                <p className="text-sm text-vault-light-gray mt-1">
                  Review what will be uploaded
                </p>
              </div>
              <Button
                onClick={resetUpload}
                variant="outline"
                size="sm"
              >
                Choose Different Folder
              </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-vault-gold/10 border border-vault-gold rounded-lg">
                <ImageIcon className="h-8 w-8 mx-auto mb-2 text-vault-gold" />
                <p className="text-2xl font-bold text-vault-gold">
                  {scanResults.validFiles}
                </p>
                <p className="text-xs text-vault-light-gray">Will Upload</p>
              </div>
              
              <div className="text-center p-4 bg-vault-dark-gray rounded-lg">
                <AlertCircle className="h-8 w-8 mx-auto mb-2 text-vault-light-gray" />
                <p className="text-2xl font-bold text-vault-platinum">
                  {scanResults.duplicates}
                </p>
                <p className="text-xs text-vault-light-gray">Duplicates</p>
              </div>
              
              <div className="text-center p-4 bg-vault-dark-gray rounded-lg">
                <AlertCircle className="h-8 w-8 mx-auto mb-2 text-vault-light-gray" />
                <p className="text-2xl font-bold text-vault-platinum">
                  {scanResults.screenshots}
                </p>
                <p className="text-xs text-vault-light-gray">Screenshots</p>
              </div>
              
              <div className="text-center p-4 bg-vault-dark-gray rounded-lg">
                <AlertCircle className="h-8 w-8 mx-auto mb-2 text-vault-light-gray" />
                <p className="text-2xl font-bold text-vault-platinum">
                  {scanResults.smallFiles}
                </p>
                <p className="text-xs text-vault-light-gray">Too Small</p>
              </div>
            </div>

            <div className="border-t border-vault-mid-gray pt-4">
              <h4 className="text-sm font-bold text-vault-platinum uppercase mb-3">
                Upload Estimates
              </h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-vault-dark-gray rounded-lg">
                  <Clock className="h-6 w-6 mx-auto mb-2 text-vault-gold" />
                  <p className="text-xl font-bold text-vault-platinum">
                    {scanResults.estimatedTime < 60 
                      ? `${scanResults.estimatedTime}m`
                      : `${Math.floor(scanResults.estimatedTime / 60)}h ${scanResults.estimatedTime % 60}m`
                    }
                  </p>
                  <p className="text-xs text-vault-light-gray">Est. Time</p>
                </div>
                
                <div className="text-center p-4 bg-vault-dark-gray rounded-lg">
                  <TrendingUp className="h-6 w-6 mx-auto mb-2 text-vault-gold" />
                  <p className="text-xl font-bold text-vault-platinum">
                    ${scanResults.estimatedCost.toFixed(2)}
                  </p>
                  <p className="text-xs text-vault-light-gray">Est. Cost</p>
                </div>
                
                <div className="text-center p-4 bg-vault-dark-gray rounded-lg">
                  <ImageIcon className="h-6 w-6 mx-auto mb-2 text-vault-gold" />
                  <p className="text-xl font-bold text-vault-platinum">
                    {(scanResults.totalSize / (1024 * 1024 * 1024)).toFixed(2)} GB
                  </p>
                  <p className="text-xs text-vault-light-gray">Total Size</p>
                </div>
              </div>
            </div>

            {scanResults.validFiles === 0 ? (
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                <p className="text-yellow-400 text-sm text-center">
                  No files will be uploaded with current filters. Try adjusting your filter settings.
                </p>
              </div>
            ) : (
              <div className="flex gap-3">
                <Button
                  onClick={scanFolder}
                  variant="outline"
                  className="flex-1"
                >
                  <Search className="mr-2 h-4 w-4" />
                  Scan Again
                </Button>
                <Button
                  onClick={startUpload}
                  className="flex-1 bg-vault-gold hover:bg-[#C4A037] text-background"
                >
                  <Play className="mr-2 h-4 w-4" />
                  Start Upload ({scanResults.validFiles} files)
                </Button>
              </div>
            )}
          </div>
        </Card>
      )}

      {(status === 'running' || status === 'paused') && (
        <Card className="p-6 border-vault-mid-gray bg-card">
          <div className="space-y-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-xl font-bold text-vault-platinum">
                  {status === 'running' ? 'Processing Photos...' : 'Paused'}
                </h3>
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setMinimized(true)}
                    className="text-vault-light-gray hover:text-vault-gold hover:bg-vault-gold/10"
                  >
                    <Minimize2 className="h-4 w-4 mr-2" />
                    Minimize
                  </Button>
                  <span className="text-vault-gold font-mono text-xl font-bold">
                    {Math.round(progress)}%
                  </span>
                </div>
              </div>
              
              <Progress value={progress} className="h-3 mb-2" />
              
              <div className="flex justify-between text-sm text-vault-light-gray">
                <span>{stats.processed} of {stats.total} processed</span>
                <span>Time remaining: {getTimeRemaining()}</span>
              </div>
            </div>

            {stats.currentFile && (
              <div className="bg-vault-dark-gray rounded-lg p-4">
                <p className="text-xs text-vault-light-gray mb-1">Currently analyzing:</p>
                <p className="text-sm text-vault-platinum font-medium truncate">
                  {stats.currentFile}
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="text-center p-3 bg-vault-dark-gray rounded-lg">
                <CheckCircle2 className="h-6 w-6 mx-auto mb-1 text-vault-green" />
                <p className="text-xl font-bold text-vault-platinum">{stats.successful}</p>
                <p className="text-xs text-vault-light-gray">Successful</p>
              </div>
              
              <div className="text-center p-3 bg-vault-dark-gray rounded-lg">
                <AlertCircle className="h-6 w-6 mx-auto mb-1 text-vault-gold" />
                <p className="text-xl font-bold text-vault-platinum">{stats.skipped}</p>
                <p className="text-xs text-vault-light-gray">Skipped</p>
              </div>
              
              <div className="text-center p-3 bg-vault-dark-gray rounded-lg">
                <AlertCircle className="h-6 w-6 mx-auto mb-1 text-red-400" />
                <p className="text-xl font-bold text-vault-platinum">{stats.failed}</p>
                <p className="text-xs text-vault-light-gray">Failed</p>
              </div>
              
              <div className="text-center p-3 bg-vault-dark-gray rounded-lg">
                <ImageIcon className="h-6 w-6 mx-auto mb-1 text-vault-platinum" />
                <p className="text-xl font-bold text-vault-platinum">
                  {stats.total - stats.processed}
                </p>
                <p className="text-xs text-vault-light-gray">Remaining</p>
              </div>
            </div>

            <div className="border-t border-vault-mid-gray pt-4">
              <h4 className="text-sm font-bold text-vault-platinum uppercase mb-3">
                Quality Distribution
              </h4>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-3 bg-vault-gold/10 border border-vault-gold rounded-lg">
                  <p className="text-2xl font-bold text-vault-gold">{stats.vaultWorthy}</p>
                  <p className="text-xs text-vault-light-gray">Vault Worthy</p>
                </div>
                <div className="text-center p-3 bg-vault-green/10 border border-vault-green rounded-lg">
                  <p className="text-2xl font-bold text-vault-green">{stats.highValue}</p>
                  <p className="text-xs text-vault-light-gray">High Value</p>
                </div>
                <div className="text-center p-3 bg-vault-mid-gray rounded-lg">
                  <p className="text-2xl font-bold text-vault-platinum">{stats.archive}</p>
                  <p className="text-xs text-vault-light-gray">Archive</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              {status === 'running' ? (
                <Button
                  onClick={pauseUpload}
                  variant="outline"
                  className="flex-1"
                >
                  <Pause className="mr-2 h-4 w-4" />
                  Pause
                </Button>
              ) : (
                <Button
                  onClick={resumeUpload}
                  className="flex-1 bg-vault-gold hover:bg-[#C4A037] text-background"
                >
                  <Play className="mr-2 h-4 w-4" />
                  Resume
                </Button>
              )}
              
              <Button
                onClick={cancelUpload}
                variant="outline"
                className="flex-1 border-red-500 text-red-400 hover:bg-red-500/10"
              >
                <StopCircle className="mr-2 h-4 w-4" />
                Cancel
              </Button>
            </div>

            {stats.errors.length > 0 && (
              <details className="bg-red-500/5 border border-red-500/20 rounded-lg p-4">
                <summary className="cursor-pointer text-red-400 font-medium text-sm">
                  {stats.errors.length} errors occurred (click to view)
                </summary>
                <div className="mt-3 space-y-2 max-h-48 overflow-y-auto">
                  {stats.errors.map((err, idx) => (
                    <div key={idx} className="text-xs text-vault-light-gray">
                      <span className="text-red-400">{err.filename}:</span> {err.error}
                    </div>
                  ))}
                </div>
              </details>
            )}
          </div>
        </Card>
      )}

      {status === 'complete' && (
        <Card className="p-8 border-vault-gold bg-card">
          <div className="text-center space-y-6">
            <div className="mx-auto w-20 h-20 rounded-full bg-vault-gold/10 flex items-center justify-center">
              <CheckCircle2 className="h-12 w-12 text-vault-gold" />
            </div>
            
            <div>
              <h3 className="text-2xl font-bold text-vault-platinum mb-2">
                Upload Complete!
              </h3>
              <p className="text-vault-light-gray">
                {stats.successful} photos successfully analyzed and added to your vault
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
              <div className="text-center p-4 bg-vault-gold/10 border border-vault-gold rounded-lg">
                <p className="text-3xl font-bold text-vault-gold mb-1">
                  {stats.vaultWorthy}
                </p>
                <p className="text-sm text-vault-light-gray">Vault Worthy</p>
              </div>
              <div className="text-center p-4 bg-vault-green/10 border border-vault-green rounded-lg">
                <p className="text-3xl font-bold text-vault-green mb-1">
                  {stats.highValue}
                </p>
                <p className="text-sm text-vault-light-gray">High Value</p>
              </div>
              <div className="text-center p-4 bg-vault-mid-gray rounded-lg">
                <p className="text-3xl font-bold text-vault-platinum mb-1">
                  {stats.archive}
                </p>
                <p className="text-sm text-vault-light-gray">Archive</p>
              </div>
            </div>

            {stats.failed > 0 && (
              <p className="text-sm text-red-400">
                {stats.failed} files failed to process
              </p>
            )}

            {stats.skipped > 0 && (
              <p className="text-sm text-vault-light-gray">
                {stats.skipped} files were skipped (duplicates or filtered)
              </p>
            )}

            <div className="flex gap-3 max-w-md mx-auto">
              <Button
                onClick={() => {
                  const params = new URLSearchParams(window.location.search);
                  params.set('tab', 'gallery');
                  window.location.search = params.toString();
                }}
                className="flex-1 bg-vault-gold hover:bg-[#C4A037] text-background"
              >
                View Gallery
              </Button>
              <Button
                onClick={resetUpload}
                variant="outline"
                className="flex-1"
              >
                Upload More
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
