import MorphingLogos from './components/ui/MorphingLogos';

const HomePage = () => {
    return (
        <div className="h-screen w-screen flex justify-center items-center bg-gradient-to-b from-[#0b60cc] to-[#1c67b9] rounded-[10px] shadow-[0_0_10px_rgba(0,0,0,0.2)]">
            {/* Provide default accent colors so the logo renders standalone */}
            <MorphingLogos accentColor="#89b4fa" secondaryAccentColor="#f5c2e7" />
        </div>
    );
};

export default HomePage;
