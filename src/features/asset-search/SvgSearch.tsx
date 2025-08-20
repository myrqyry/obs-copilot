// src/features/asset-search/SvgSearch.tsx
import React from 'react';
import AssetSearch from './AssetSearch';
import SecureHtmlRenderer from '@/components/ui/SecureHtmlRenderer';
// ... (other imports will be needed for handlers)

// Define your SVG APIs
const SVG_APIS = [
    { value: 'iconfinder', label: 'Iconfinder', domain: 'iconfinder.com' },
    // Add other SVG APIs here
];

const mapSvgToStandard = (item: any) => ({
    id: item.icon_id,
    title: item.tags?.[0] || 'Icon',
    url: item.vector_sizes?.[0]?.formats?.[0]?.download_url, // Example path
    thumbnail: item.raster_sizes?.[6]?.formats?.[0]?.preview_url, // Example path
    svgContent: item.svgContent, // Assuming you fetch this separately
    // Add source and author properties to match StandardApiItem type
    source: 'iconfinder', // Assuming this is the source
    author: item.user?.username || 'Unknown' // Use the username if available, otherwise default to 'Unknown'
});


const SvgSearch: React.FC = () => {
    // ... (Your handler functions like handleAddAsBrowserSource, getModalActions, etc.)

    const renderGridItem = (item: any, onClick: () => void) => (
        <div key={item.id} className="relative group cursor-pointer h-full bg-slate-800 rounded-md p-2" onClick={onClick}>
             <SecureHtmlRenderer 
                 htmlContent={item.svgContent} 
                 allowedTags={['svg','path','g','circle','rect','line','polygon','polyline','ellipse','defs','use','linearGradient','radialGradient','stop']}
                 allowedAttributes={['viewBox','d','fill','stroke','stroke-width','cx','cy','r','x','y','width','height','points','x1','y1','x2','y2','rx','ry','transform','id','href','xlink:href','offset','stop-color','stop-opacity']}
                 className="w-full h-full"
             />
        </div>
    );
     const renderModalContent = (item: any) => (
        <div className="p-4 bg-slate-800 rounded-md flex justify-center items-center">
            <SecureHtmlRenderer 
                htmlContent={item.svgContent} 
                allowedTags={['svg','path','g','circle','rect','line','polygon','polyline','ellipse','defs','use','linearGradient','radialGradient','stop']}
                allowedAttributes={['viewBox','d','fill','stroke','stroke-width','cx','cy','r','x','y','width','height','points','x1','y1','x2','y2','rx','ry','transform','id','href','xlink:href','offset','stop-color','stop-opacity']}
                className="w-64 h-64"
            />
        </div>
    );

    return (
        <AssetSearch
            title="SVG Icons"
            emoji="🎨"
            apiConfigs={SVG_APIS}
            apiMapper={mapSvgToStandard}
            renderGridItem={renderGridItem}
            renderModalContent={renderModalContent}
            getModalActions={() => [] /* Implement actions */}
        />
    );
};

export default SvgSearch;