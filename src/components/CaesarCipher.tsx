'use client';

import { useState, useEffect, useRef } from 'react';

interface CipherRingProps {
  isOuter: boolean;
  rotation: number;
  letters: string[];
  highlightIndex?: number;
}

const CipherRing: React.FC<CipherRingProps> = ({ isOuter, rotation, letters, highlightIndex = -1 }) => {
  const ringColor = isOuter ? 'border-gray-400' : 'border-gray-600';
  const ringSize = isOuter ? '24rem' : '19rem';
  const textSize = isOuter ? 'text-lg' : 'text-base';
  const bgColor = isOuter 
    ? 'bg-white dark:bg-gray-800' 
    : 'bg-gray-100 dark:bg-gray-700';
  
  return (
    <div 
      className={`absolute rounded-full border-4 ${ringColor} flex items-center justify-center transition-transform duration-1000 shadow-lg backdrop-blur-sm bg-opacity-90`}
      style={{ 
        width: ringSize, 
        height: ringSize,
        transform: `rotate(${-rotation}deg)`
      }}
    >
      {letters.map((letter, index) => {
        const angle = (index * 360) / letters.length;
        const radius = isOuter ? 12 : 9.5;
        const isHighlighted = index === highlightIndex;
        
        return (
          <div
            key={index}
            className={`absolute ${textSize} font-bold transition-all duration-300 transform`}
            style={{
              transform: `
                rotate(${angle}deg) 
                translateY(-${radius}rem) 
                rotate(${-angle + rotation}deg)
              `,
            }}
          >
            <div className={`
              ${isOuter ? 'w-10 h-10' : 'w-8 h-8'} rounded-full flex items-center justify-center
              ${isHighlighted 
                ? 'bg-gray-900 text-white scale-110 shadow-lg dark:bg-white dark:text-gray-900' 
                : `${bgColor} text-gray-900 dark:text-white shadow-sm hover:scale-105`}
              transition-all duration-300 ease-in-out
            `}>
              {letter}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const CaesarCipher: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [shift, setShift] = useState(4);
  const [outerRotation, setOuterRotation] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [highlightedInnerIndex, setHighlightedInnerIndex] = useState(-1);
  const [highlightedOuterIndex, setHighlightedOuterIndex] = useState(-1);
  const animationRef = useRef<NodeJS.Timeout | null>(null);

  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value.toUpperCase());
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isAnimating && inputText) {
      animateEncryption();
    }
  };

  const handleShiftChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newShift = parseInt(e.target.value);
    if (!isNaN(newShift) && newShift >= 0 && newShift <= 25) {
      setShift(newShift);
      setOuterRotation(newShift * (360 / 26));
    }
  };

  const encryptLetter = (letter: string): string => {
    if (!/[A-Z]/.test(letter)) return letter;
    
    const index = alphabet.indexOf(letter);
    const newIndex = (index + shift) % 26;
    return alphabet[newIndex];
  };

  const animateEncryption = () => {
    if (!inputText) return;
    
    setIsAnimating(true);
    setOutputText('');
    setCurrentIndex(0);
    setHighlightedInnerIndex(-1);
    setHighlightedOuterIndex(-1);
    
    if (animationRef.current) {
      clearTimeout(animationRef.current);
    }
    
    const animate = (index: number) => {
      if (index < inputText.length) {
        const letter = inputText[index];
        const encrypted = encryptLetter(letter);
        
        if (/[A-Z]/.test(letter)) {
          // Highlight the current letter being encrypted
          const plainIndex = alphabet.indexOf(letter);
          const cipherIndex = alphabet.indexOf(encrypted);
          setHighlightedInnerIndex(plainIndex);
          setHighlightedOuterIndex(cipherIndex);
        } else {
          setHighlightedInnerIndex(-1);
          setHighlightedOuterIndex(-1);
        }
        
        // Add the encrypted letter to the output
        setOutputText(prev => prev + encrypted);
        setCurrentIndex(index + 1);
        
        // Continue animation
        animationRef.current = setTimeout(() => {
          animate(index + 1);
        }, 800);
      } else {
        setIsAnimating(false);
        setHighlightedInnerIndex(-1);
        setHighlightedOuterIndex(-1);
      }
    };
    
    animate(0);
  };

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        clearTimeout(animationRef.current);
      }
    };
  }, []);

  useEffect(() => {
    setOuterRotation(shift * (360 / 26));
  }, [shift]);

  return (
    <div className="flex flex-col items-center w-full max-w-3xl mx-auto">      
      <div className="relative w-[28rem] h-[28rem] mb-16 flex items-center justify-center mt-8">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative w-full h-full flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/20 dark:to-gray-900/20 rounded-full"></div>
            <CipherRing isOuter={true} rotation={outerRotation} letters={alphabet} highlightIndex={highlightedOuterIndex} />
            <CipherRing isOuter={false} rotation={0} letters={alphabet} highlightIndex={highlightedInnerIndex} />
          </div>
        </div>
        <div className="absolute -top-16 left-1/2 transform -translate-x-1/2">
          <div className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-6 py-1.5 rounded-full text-sm font-medium shadow-md">
            Shift: {shift}
          </div>
        </div>
      </div>
      
      <div className="w-full space-y-6">
        <div>
          <label htmlFor="shift" className="block text-sm font-medium mb-2">
            Shift Value (0-25)
          </label>
          <input
            type="range"
            id="shift"
            min="0"
            max="25"
            value={shift}
            onChange={handleShiftChange}
            className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs mt-1">
            <span>0</span>
            <span>25</span>
          </div>
        </div>
        
        <div>
          <label htmlFor="input" className="block text-sm font-medium mb-2">
            Text to Encrypt
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              id="input"
              value={inputText}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder="Enter text and press Enter or click Encrypt"
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
            <button
              onClick={animateEncryption}
              disabled={isAnimating || !inputText}
              className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-6 py-2 rounded-md hover:bg-gray-800 dark:hover:bg-gray-100 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-all duration-300 font-medium shadow-md min-w-[120px]"
            >
              {isAnimating ? 'Encrypting...' : 'Encrypt'}
            </button>
          </div>
        </div>
        
        <div>
          <label htmlFor="output" className="block text-sm font-medium mb-2">
            Encrypted Text
          </label>
          <div 
            id="output"
            aria-label="Encrypted Text"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md min-h-[42px] bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white font-mono shadow-inner"
          >
            {outputText}
          </div>
        </div>
        
        {isAnimating && (
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1 mt-4">
            <div 
              className="bg-gray-900 dark:bg-white h-1 rounded-full transition-all duration-500" 
              style={{ width: `${(currentIndex / inputText.length) * 100}%` }}
            ></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CaesarCipher; 