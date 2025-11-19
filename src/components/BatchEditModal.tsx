import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { useBatchPhotoEdit, BatchEditData } from '@/hooks/useBatchPhotoEdit';

interface BatchEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCount: number;
  onSuccess: () => void;
  selectedPhotoIds: string[];
}

export function BatchEditModal({
  open,
  onOpenChange,
  selectedCount,
  onSuccess,
  selectedPhotoIds,
}: BatchEditModalProps) {
  const [description, setDescription] = useState('');
  const [userNotes, setUserNotes] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [isFavorite, setIsFavorite] = useState<boolean | null>(null);
  const [applyDescription, setApplyDescription] = useState(false);
  const [applyNotes, setApplyNotes] = useState(false);
  const [applyTags, setApplyTags] = useState(false);
  const [applyFavorite, setApplyFavorite] = useState(false);

  const { batchUpdatePhotos, isProcessing } = useBatchPhotoEdit();

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setDescription('');
      setUserNotes('');
      setTagInput('');
      setTags([]);
      setIsFavorite(null);
      setApplyDescription(false);
      setApplyNotes(false);
      setApplyTags(false);
      setApplyFavorite(false);
    }
  }, [open]);

  const handleAddTag = () => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleSave = async () => {
    const updates: BatchEditData = {};

    if (applyDescription) {
      updates.description = description;
    }

    if (applyNotes) {
      updates.user_notes = userNotes;
    }

    if (applyTags) {
      updates.custom_tags = tags;
    }

    if (applyFavorite && isFavorite !== null) {
      updates.is_favorite = isFavorite;
    }

    const success = await batchUpdatePhotos(selectedPhotoIds, updates);
    
    if (success) {
      onOpenChange(false);
      onSuccess();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-vault-dark-gray border-vault-mid-gray">
        <DialogHeader>
          <DialogTitle className="text-vault-platinum font-bold uppercase tracking-wide">
            Batch Edit Metadata
          </DialogTitle>
          <DialogDescription className="text-vault-light-gray">
            Update metadata for {selectedCount} selected photo{selectedCount !== 1 ? 's' : ''}. 
            Enable the fields you want to update.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Description */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-vault-platinum font-semibold">Description</Label>
              <Switch
                checked={applyDescription}
                onCheckedChange={setApplyDescription}
              />
            </div>
            <Textarea
              placeholder="Enter description for all selected photos..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={!applyDescription}
              className="bg-vault-black border-vault-mid-gray text-vault-platinum placeholder:text-vault-light-gray disabled:opacity-50"
              rows={3}
            />
          </div>

          {/* User Notes */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-vault-platinum font-semibold">Notes</Label>
              <Switch
                checked={applyNotes}
                onCheckedChange={setApplyNotes}
              />
            </div>
            <Textarea
              placeholder="Add personal notes..."
              value={userNotes}
              onChange={(e) => setUserNotes(e.target.value)}
              disabled={!applyNotes}
              className="bg-vault-black border-vault-mid-gray text-vault-platinum placeholder:text-vault-light-gray disabled:opacity-50"
              rows={3}
            />
          </div>

          {/* Custom Tags */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-vault-platinum font-semibold">Tags</Label>
              <Switch
                checked={applyTags}
                onCheckedChange={setApplyTags}
              />
            </div>
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  placeholder="Add tag and press Enter..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={!applyTags}
                  className="bg-vault-black border-vault-mid-gray text-vault-platinum placeholder:text-vault-light-gray disabled:opacity-50"
                />
                <Button
                  type="button"
                  onClick={handleAddTag}
                  disabled={!applyTags || !tagInput.trim()}
                  size="sm"
                  className="bg-vault-gold hover:bg-vault-gold/90 text-vault-black font-bold"
                >
                  Add
                </Button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="bg-vault-gold/20 text-vault-gold border-vault-gold/30 hover:bg-vault-gold/30"
                    >
                      {tag}
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1 hover:text-vault-platinum"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Favorite Toggle */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-vault-platinum font-semibold">Mark as Favorite</Label>
              <Switch
                checked={applyFavorite}
                onCheckedChange={setApplyFavorite}
              />
            </div>
            {applyFavorite && (
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={isFavorite === true ? 'default' : 'outline'}
                  onClick={() => setIsFavorite(true)}
                  className={isFavorite === true 
                    ? 'bg-vault-gold hover:bg-vault-gold/90 text-vault-black font-bold' 
                    : 'bg-vault-black border-vault-mid-gray text-vault-platinum hover:border-vault-gold'
                  }
                >
                  ⭐ Favorite
                </Button>
                <Button
                  type="button"
                  variant={isFavorite === false ? 'default' : 'outline'}
                  onClick={() => setIsFavorite(false)}
                  className={isFavorite === false 
                    ? 'bg-vault-gold hover:bg-vault-gold/90 text-vault-black font-bold' 
                    : 'bg-vault-black border-vault-mid-gray text-vault-platinum hover:border-vault-gold'
                  }
                >
                  Not Favorite
                </Button>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isProcessing}
            className="bg-vault-black border-vault-mid-gray text-vault-platinum hover:border-vault-gold"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isProcessing || (!applyDescription && !applyNotes && !applyTags && !applyFavorite)}
            className="bg-vault-gold hover:bg-vault-gold/90 text-vault-black font-bold uppercase tracking-wide"
          >
            {isProcessing ? 'Updating...' : `Update ${selectedCount} Photo${selectedCount !== 1 ? 's' : ''}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
