import React from 'react';
import useEmoteWallStore from '@/store/emoteWallStore';
import { AnimationStyle } from '../core/types';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

const EmoteWallConfig: React.FC = () => {
  const { animationStyle, setAnimationStyle, physicsEnabled, setPhysicsEnabled } = useEmoteWallStore();

  const animationOptions: AnimationStyle[] = ['bounce', 'slide', 'epic', 'physics'];

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Emote Wall Configuration</h2>
      <div className="space-y-4">
        <div>
          <Label htmlFor="animation-style">Animation Style</Label>
          <Select
            value={animationStyle}
            onValueChange={(value: AnimationStyle) => setAnimationStyle(value)}
          >
            <SelectTrigger id="animation-style" className="w-full">
              <SelectValue placeholder="Select an animation style" />
            </SelectTrigger>
            <SelectContent>
              {animationOptions.map((style) => (
                <SelectItem key={style} value={style}>
                  {style.charAt(0).toUpperCase() + style.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="physics-enabled">Enable Physics</Label>
          <Switch
            id="physics-enabled"
            checked={physicsEnabled}
            onCheckedChange={setPhysicsEnabled}
          />
        </div>
      </div>
    </div>
  );
};

export default EmoteWallConfig;