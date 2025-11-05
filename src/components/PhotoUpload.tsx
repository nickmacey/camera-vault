import { useCallback, useState } from "react";
import { Upload, ImageIcon, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const PhotoUpload = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [useAI, setUseAI] = useState(true);
  const [files, setFiles] = useState<File[]>([]);
  const { toast } = useToast();

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files).filter(file =>
      file.type.startsWith("image/")
    );

    if (droppedFiles.length > 0) {
      setFiles(droppedFiles);
      toast({
        title: "Files ready",
        description: `${droppedFiles.length} photo(s) selected`,
      });
    }
  }, [toast]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setFiles(selectedFiles);
      toast({
        title: "Files ready",
        description: `${selectedFiles.length} photo(s) selected`,
      });
    }
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    toast({
      title: "Upload started",
      description: `Processing ${files.length} photo(s)...`,
    });

    // TODO: Implement actual upload with Lovable Cloud
    setTimeout(() => {
      toast({
        title: "Success!",
        description: `${files.length} photo(s) analyzed and scored`,
      });
      setFiles([]);
    }, 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card
        className={`p-12 border-2 border-dashed transition-all duration-300 ${
          isDragging
            ? "border-primary bg-primary/5 scale-105"
            : "border-border hover:border-primary/50"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="text-center space-y-4">
          <div className="inline-flex p-4 rounded-full bg-primary/10 mx-auto">
            <Upload className="h-12 w-12 text-primary" />
          </div>

          <div>
            <h3 className="text-2xl font-bold mb-2">Upload Photos</h3>
            <p className="text-muted-foreground">
              Drag and drop your photos here, or click to browse
            </p>
          </div>

          <input
            type="file"
            id="file-upload"
            className="hidden"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
          />

          <Button asChild variant="outline" size="lg">
            <label htmlFor="file-upload" className="cursor-pointer">
              <ImageIcon className="mr-2 h-5 w-5" />
              Choose Photos
            </label>
          </Button>

          <div className="flex items-center justify-center gap-2 pt-4">
            <Switch
              id="ai-analysis"
              checked={useAI}
              onCheckedChange={setUseAI}
            />
            <Label htmlFor="ai-analysis" className="flex items-center gap-2 cursor-pointer">
              <Sparkles className="h-4 w-4 text-secondary" />
              Enable AI Analysis
            </Label>
          </div>
        </div>
      </Card>

      {files.length > 0 && (
        <Card className="p-6 animate-scale-in">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="font-semibold">Selected Photos</h4>
              <p className="text-sm text-muted-foreground">
                {files.length} file(s) ready to upload
              </p>
            </div>
            <Button onClick={handleUpload} className="gap-2">
              <Upload className="h-4 w-4" />
              Upload & Analyze
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {files.map((file, idx) => (
              <div
                key={idx}
                className="relative aspect-square rounded-lg overflow-hidden bg-muted"
              >
                <img
                  src={URL.createObjectURL(file)}
                  alt={file.name}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default PhotoUpload;
