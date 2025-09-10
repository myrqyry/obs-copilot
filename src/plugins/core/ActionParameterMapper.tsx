import React from 'react';
import { TextInput } from '@/components/common/TextInput';

interface ActionParameterMapperProps {
    parameters: Record<string, any>;
    onChange: (newParams: Record<string, any>) => void;
    id: string; // Used for unique keys
}

export const ActionParameterMapper: React.FC<ActionParameterMapperProps> = ({ parameters, onChange, id }) => {
    const handleParamChange = (key: string, value: any) => {
        onChange({
            ...parameters,
            [key]: value,
        });
    };

    return (
        <div className="space-y-4">
            {Object.entries(parameters).map(([key, value]) => {
                const inputId = `${id}-${key}`;
                const type = typeof value;

                return (
                    <div key={key}>
                        <label htmlFor={inputId} className="text-sm font-medium text-gray-300 capitalize mb-1 block">
                            {key.replace(/([A-Z])/g, ' $1')}
                        </label>
                        {type === 'boolean' && (
                            <div className="flex items-center">
                                <input
                                    id={inputId}
                                    type="checkbox"
                                    checked={value}
                                    onChange={(e) => handleParamChange(key, e.target.checked)}
                                    className="h-4 w-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                                />
                                <span className="ml-2 text-sm text-gray-300">{value ? 'Enabled' : 'Disabled'}</span>
                            </div>
                        )}
                        {type === 'number' && (
                            <TextInput
                                id={inputId}
                                type="number"
                                value={String(value)}
                                onValueChange={(val) => handleParamChange(key, Number(val))}
                                className="w-full"
                            />
                        )}
                        {type === 'string' && (
                            <TextInput
                                id={inputId}
                                type="text"
                                value={value}
                                onValueChange={(val) => handleParamChange(key, val)}
                                className="w-full"
                            />
                        )}
                        {type !== 'boolean' && type !== 'number' && type !== 'string' && (
                             <TextInput
                                id={inputId}
                                type="text"
                                value={String(value)}
                                onValueChange={(val) => handleParamChange(key, val)}
                                className="w-full"
                                disabled
                            />
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default ActionParameterMapper;
