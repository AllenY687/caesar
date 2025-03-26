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
  const audioContextRef = useRef<AudioContext | null>(null);
  const spinningSoundRef = useRef<{
    oscillator1: OscillatorNode;
    oscillator2: OscillatorNode;
    noiseNode: AudioBufferSourceNode;
    noiseGain: GainNode;
    gainNode: GainNode;
  } | null>(null);
  const lastRotationRef = useRef(0);
  const noiseStopTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  
  // Create audio context and spinning sound
  useEffect(() => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Create oscillators for a wooden wheel sound
    const oscillator1 = audioContext.createOscillator();
    const oscillator2 = audioContext.createOscillator();
    const noiseNode = audioContext.createBufferSource();
    const noiseGain = audioContext.createGain();
    const gainNode = audioContext.createGain();
    
    // Create noise buffer for texture
    const bufferSize = audioContext.sampleRate * 2;
    const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    noiseNode.buffer = buffer;
    noiseNode.loop = true;
    
    // Configure oscillators for a wooden sound
    oscillator1.type = 'sine';
    oscillator2.type = 'sine';
    
    // Set initial frequencies (lower frequencies for wooden resonance)
    oscillator1.frequency.setValueAtTime(110, audioContext.currentTime);
    oscillator2.frequency.setValueAtTime(220, audioContext.currentTime);
    
    // Set initial gain to 0 (silent)
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    noiseGain.gain.setValueAtTime(0, audioContext.currentTime);
    
    // Connect nodes
    oscillator1.connect(gainNode);
    oscillator2.connect(gainNode);
    noiseNode.connect(noiseGain);
    noiseGain.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Start oscillators and noise
    oscillator1.start();
    oscillator2.start();
    noiseNode.start();
    
    audioContextRef.current = audioContext;
    spinningSoundRef.current = { 
      oscillator1, 
      oscillator2, 
      noiseNode,
      noiseGain,
      gainNode 
    };
    
    return () => {
      oscillator1.stop();
      oscillator2.stop();
      noiseNode.stop();
      if (noiseStopTimeoutRef.current) {
        clearTimeout(noiseStopTimeoutRef.current);
      }
    };
  }, []);

  const stopNoise = () => {
    if (!spinningSoundRef.current) return;
    
    const { noiseGain } = spinningSoundRef.current;
    
    // Fade out noise
    noiseGain.gain.linearRampToValueAtTime(0, audioContextRef.current?.currentTime || 0 + 0.1);
    
    // Stop noise after fade out
    if (noiseStopTimeoutRef.current) {
      clearTimeout(noiseStopTimeoutRef.current);
    }
    noiseStopTimeoutRef.current = setTimeout(() => {
      if (spinningSoundRef.current) {
        spinningSoundRef.current.noiseNode.stop();
      }
    }, 100);
  };

  const playSpinningSound = (rotation: number) => {
    if (!audioContextRef.current || !spinningSoundRef.current) return;
    
    const audioContext = audioContextRef.current;
    const { oscillator1, oscillator2, noiseNode, noiseGain, gainNode } = spinningSoundRef.current;
    
    // Resume audio context if it was suspended
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }
    
    // Calculate rotation speed
    const rotationDiff = Math.abs(rotation - lastRotationRef.current);
    
    // Update frequencies based on rotation speed (lower frequencies for wooden sound)
    const baseFreq1 = 110; // Lower base frequency for wooden resonance
    const baseFreq2 = 220;
    const freq1 = baseFreq1 + (rotationDiff * 0.75); // Slower frequency change
    const freq2 = baseFreq2 + (rotationDiff * 1.5);
    
    oscillator1.frequency.setValueAtTime(freq1, audioContext.currentTime);
    oscillator2.frequency.setValueAtTime(freq2, audioContext.currentTime);
    
    // Fade in
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.12, audioContext.currentTime + 0.1);
    noiseGain.gain.setValueAtTime(0, audioContext.currentTime);
    noiseGain.gain.linearRampToValueAtTime(0.03, audioContext.currentTime + 0.1);
    
    // Fade out
    gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.8);
    noiseGain.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.8);
    
    // Stop noise after fade out
    if (noiseStopTimeoutRef.current) {
      clearTimeout(noiseStopTimeoutRef.current);
    }
    noiseStopTimeoutRef.current = setTimeout(() => {
      stopNoise();
    }, 800);
    
    lastRotationRef.current = rotation;
  };

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
      const newRotation = newShift * (360 / 26);
      setOuterRotation(newRotation);
      playSpinningSound(newRotation);
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
          
          // Play spinning sound for each letter encryption
          playSpinningSound(outerRotation);
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
        stopNoise(); // Stop noise when encryption is complete
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