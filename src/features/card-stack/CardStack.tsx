import { motion } from 'framer-motion';

interface CardStackProps {
  items: Array<{ id: string; title: string; description: string; image: string }>;
}

export const CardStack = ({ items }: CardStackProps) => {
  return (
    <div className="relative">
      {items.map((item, index) => (
        <motion.div
          key={item.id}
          className="absolute inset-0 bg-white rounded-lg shadow-lg"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.1 }}
        >
          <div className="p-4">
            <h3 className="text-xl font-bold">{item.title}</h3>
            <p>{item.description}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
};