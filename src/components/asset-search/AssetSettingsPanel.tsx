import React, { useState, useCallback } from 'react';
import { X, Save, Eye, EyeOff, Key, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/components/ui/use-toast';
import useConfigStore from '@/store/configStore';
import { ApiKeyState } from '@/store/configStore';
import { getConfigsByCategory } from '@/config/assetSearchConfigs';

interface AssetSettingsPanelProps {
  activeCategory: string;
  onClose: () => void;
}

interface ApiKeyConfig {
  key: keyof Omit<ApiKeyState, 'setApiKey'>;
  label: string;
  description: string;
  placeholder: string;
  helpUrl?: string;
  testEndpoint?: string;
}

const apiKeyConfigs: Record<string, ApiKeyConfig> = {
  GIPHY_API_KEY: {
    key: 'GIPHY_API_KEY',
    label: 'Giphy API Key',
    description: 'Access animated GIFs from Giphy',
    placeholder: 'Enter your Giphy API key',
    helpUrl: 'https://developers.giphy.com/docs/api/endpoint#search',
    testEndpoint: 'https://api.giphy.com/v1/gifs/search'
  },
  TENOR_API_KEY: {
    key: 'TENOR_API_KEY',
    label: 'Tenor API Key',
    description: 'Access GIFs and stickers from Tenor',
    placeholder: 'Enter your Tenor API key',
    helpUrl: 'https://developers.google.com/tenor/guides/quickstart',
    testEndpoint: 'https://tenor.googleapis.com/v2/search'
  },
  ICONFINDER_API_KEY: {
    key: 'ICONFINDER_API_KEY',
    label: 'Iconfinder API Key',
    description: 'Access premium icons from Iconfinder',
    placeholder: 'Enter your Iconfinder API key',
    helpUrl: 'https://www.iconfinder.com/api-solution',
    testEndpoint: 'https://api.iconfinder.com/v4/icons/search'
  },
  PEXELS_API_KEY: {
    key: 'PEXELS_API_KEY',
    label: 'Pexels API Key',
    description: 'Access stock photos from Pexels',
    placeholder: 'Enter your Pexels API key',
    helpUrl: 'https://www.pexels.com/api/documentation/',
    testEndpoint: 'https://api.pexels.com/v1/search'
  },
  PIXABAY_API_KEY: {
    key: 'PIXABAY_API_KEY',
    label: 'Pixabay API Key',
    description: 'Access images and vectors from Pixabay',
    placeholder: 'Enter your Pixabay API key',
    helpUrl: 'https://pixabay.com/api/docs/',
    testEndpoint: 'https://pixabay.com/api/'
  },
  DEVIANTART_CLIENT_ID: {
    key: 'DEVIANTART_CLIENT_ID',
    label: 'DeviantArt Client ID',
    description: 'Access artwork from DeviantArt',
    placeholder: 'Enter your DeviantArt client ID',
    helpUrl: 'https://www.deviantart.com/developers/',
    testEndpoint: 'https://www.deviantart.com/api/v1/oauth2/search'
  },
  UNSPLASH_ACCESS_KEY: {
    key: 'UNSPLASH_ACCESS_KEY',
    label: 'Unsplash Access Key',
    description: 'Access high-quality photos from Unsplash',
    placeholder: 'Enter your Unsplash Access Key',
    helpUrl: 'https://unsplash.com/developers',
    testEndpoint: 'https://api.unsplash.com/search/photos'
  }
};

export const AssetSettingsPanel: React.FC<AssetSettingsPanelProps> = ({
  activeCategory,
  onClose
}) => {
  const config = useConfigStore();
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [testingKeys, setTestingKeys] = useState<Record<string, boolean>>({});
  const [testResults, setTestResults] = useState<Record<string, 'success' | 'error' | null>>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Get required API keys for current category
  const categoryConfigs = getConfigsByCategory(activeCategory as any);
  const requiredKeys = categoryConfigs
    .filter(config => config.requiresAuth)
    .map(config => `${config.value.toUpperCase()}_API_KEY`)
    .filter(key => key in apiKeyConfigs);

  const toggleKeyVisibility = useCallback((key: string) => {
    setShowKeys(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const handleKeyChange = useCallback((key: keyof ApiKeyState, value: string) => {
    config.setApiKey(key, value);
    setHasUnsavedChanges(true);
    setTestResults(prev => ({ ...prev, [key]: null }));
  }, [config]);

  const testApiKey = useCallback(async (key: string) => {
    const apiKeyConfig = apiKeyConfigs[key];
    const keyValue = config[key as keyof ApiKeyState];

    if (!config || !keyValue) return;

    setTestingKeys(prev => ({ ...prev, [key]: true }));

    try {
      const response = await fetch(`${config.testEndpoint}?q=test&limit=1`, {
        headers: {
          'Authorization': `Bearer ${keyValue}`,
          'X-API-KEY': keyValue,
          'User-Agent': 'OBS-Copilot/1.0'
        }
      });

      if (response.ok) {
        setTestResults(prev => ({ ...prev, [key]: 'success' }));
        toast({
          title: 'API Key Valid',
          description: `${config.label} is working correctly`,
          variant: 'default'
        });
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      setTestResults(prev => ({ ...prev, [key]: 'error' }));
      toast({
        title: 'API Key Invalid',
        description: `Failed to validate ${config.label}`,
        variant: 'destructive'
      });
    } finally {
      setTestingKeys(prev => ({ ...prev, [key]: false }));
    }
  }, [apiKeys]);

  const saveSettings = useCallback(() => {
    setHasUnsavedChanges(false);
    toast({
      title: 'Settings Saved',
      description: 'Your API keys have been saved securely',
      variant: 'default'
    });
  }, []);

  return (
    <div className="w-96 bg-white border-l shadow-lg flex flex-col">
      <div className="p-4 border-b flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Asset Settings</h3>
          <p className="text-sm text-gray-600">Configure API keys and preferences</p>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>
      <Tabs defaultValue="api-keys" className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-2 m-4">
          <TabsTrigger value="api-keys">API Keys</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
        </TabsList>
        <div className="flex-1 overflow-hidden">
          <TabsContent value="api-keys" className="h-full m-0">
            <ScrollArea className="h-full">
              <div className="p-4 space-y-4">
                {requiredKeys.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <Key className="w-4 h-4" />
                      Required for {activeCategory}
                    </h4>
                    {requiredKeys.map(key => {
                      const apiKeyConfig = apiKeyConfigs[key];
                      if (!apiKeyConfig) return null;
                      const currentValue = config[apiKeyConfig.key] || '';
                      const isValid = testResults[apiKeyConfig.key] === 'success';
                      const hasError = testResults[config.key] === 'error';
                      const isTesting = testingKeys[config.key];
                      return (
                        <Card key={key} className="relative">
                          <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-sm font-medium">{config.label}</CardTitle>
                              <div className="flex items-center gap-2">
                                {isValid && <Badge variant="outline" className="text-green-600 border-green-300"><Check className="w-3 h-3 mr-1" />Valid</Badge>}
                                {hasError && <Badge variant="outline" className="text-red-600 border-red-300"><AlertCircle className="w-3 h-3 mr-1" />Invalid</Badge>}
                              </div>
                            </div>
                            <p className="text-xs text-gray-600">{config.description}</p>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div className="relative">
                              <Input type={showKeys[key] ? 'text' : 'password'} placeholder={config.placeholder} value={currentValue} onChange={(e) => handleKeyChange(config.key, e.target.value)} className="pr-20" />
                              <div className="absolute inset-y-0 right-0 flex items-center">
                                <Button variant="ghost" size="sm" onClick={() => toggleKeyVisibility(key)} className="h-8 px-2 hover:bg-transparent">
                                  {showKeys[key] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </Button>
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <Button variant="outline" size="sm" onClick={() => testApiKey(key)} disabled={!currentValue || isTesting} className="text-xs">
                                {isTesting ? 'Testing...' : 'Test Key'}
                              </Button>
                              {config.helpUrl && <Button variant="ghost" size="sm" onClick={() => window.open(config.helpUrl, '_blank')} className="text-xs text-blue-600 hover:text-blue-700">Get API Key →</Button>}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
                <div>
                  <h4 className="font-medium mb-3">All API Keys</h4>
                  {Object.entries(apiKeyConfigs).filter(([key]) => !requiredKeys.includes(key)).map(([key, apiKeyConfig]) => {
                    const currentValue = config[apiKeyConfig.key] || '';
                    const isValid = testResults[apiKeyConfig.key] === 'success';
                    const hasError = testResults[config.key] === 'error';
                    const isTesting = testingKeys[config.key];
                    return (
                      <Card key={key} className="mb-3">
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-medium">{config.label}</CardTitle>
                            <div className="flex items-center gap-2">
                              {currentValue && isValid && <Badge variant="outline" className="text-green-600 border-green-300"><Check className="w-3 h-3 mr-1" />Valid</Badge>}
                              {currentValue && hasError && <Badge variant="outline" className="text-red-600 border-red-300"><AlertCircle className="w-3 h-3 mr-1" />Invalid</Badge>}
                            </div>
                          </div>
                          <p className="text-xs text-gray-600">{config.description}</p>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="relative">
                            <Input type={showKeys[key] ? 'text' : 'password'} placeholder={config.placeholder} value={currentValue} onChange={(e) => handleKeyChange(config.key, e.target.value)} className="pr-20" />
                            <div className="absolute inset-y-0 right-0 flex items-center">
                              <Button variant="ghost" size="sm" onClick={() => toggleKeyVisibility(key)} className="h-8 px-2 hover:bg-transparent">
                                {showKeys[key] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </Button>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <Button variant="outline" size="sm" onClick={() => testApiKey(key)} disabled={!currentValue || isTesting} className="text-xs">
                              {isTesting ? 'Testing...' : 'Test Key'}
                            </Button>
                            {config.helpUrl && <Button variant="ghost" size="sm" onClick={() => window.open(config.helpUrl, '_blank')} className="text-xs text-blue-600 hover:text-blue-700">Get API Key →</Button>}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            </ScrollArea>
          </TabsContent>
          <TabsContent value="preferences" className="h-full m-0">
            <ScrollArea className="h-full">
              <div className="p-4 space-y-4">
                <Card>
                  <CardHeader><CardTitle className="text-sm">Search Preferences</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between"><Label htmlFor="safe-search">Safe Search</Label><Switch id="safe-search" defaultChecked /></div>
                    <div className="flex items-center justify-between"><Label htmlFor="auto-preview">Auto Preview</Label><Switch id="auto-preview" defaultChecked /></div>
                    <div className="flex items-center justify-between"><Label htmlFor="high-quality">Prefer High Quality</Label><Switch id="high-quality" defaultChecked /></div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle className="text-sm">OBS Integration</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between"><Label htmlFor="auto-fit">Auto Fit to Screen</Label><Switch id="auto-fit" defaultChecked /></div>
                    <div className="flex items-center justify-between"><Label htmlFor="remember-settings">Remember Settings</Label><Switch id="remember-settings" defaultChecked /></div>
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>
          </TabsContent>
        </div>
      </Tabs>
      {hasUnsavedChanges && (
        <div className="p-4 border-t bg-gray-50">
          <Button onClick={saveSettings} className="w-full">
            <Save className="w-4 h-4 mr-2" />
            Save Settings
          </Button>
        </div>
      )}
    </div>
  );
};