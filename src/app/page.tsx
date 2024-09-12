import ClientCipherWrapper from '@/components/ClientCipherWrapper';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center p-6 sm:p-8">
      <div className="w-full max-w-4xl mx-auto">
        <header className="mb-8 sm:mb-12 text-center">
          <h1 className="text-4xl font-bold mb-2">
            Caesar Cipher Visualizer
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            An interactive tool to visualize the Caesar cipher encryption technique
          </p>
        </header>
        
        <main className="w-full">
          <ClientCipherWrapper />
        </main>
      </div>
    </div>
  );
}
