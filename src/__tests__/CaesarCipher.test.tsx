import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import CaesarCipher from '../components/CaesarCipher';

// Mock the setTimeout function
jest.useFakeTimers();

describe('CaesarCipher Component', () => {
  it('renders the component correctly', () => {
    render(<CaesarCipher />);
    
    // Check if the shift display is rendered
    expect(screen.getByText(/Shift:/)).toBeInTheDocument();
    
    // Check if the input field is rendered
    expect(screen.getByLabelText('Text to Encrypt')).toBeInTheDocument();
    
    // Check if the shift slider is rendered
    expect(screen.getByLabelText('Shift Value (0-25)')).toBeInTheDocument();
    
    // Check if the encrypt button is rendered
    expect(screen.getByRole('button', { name: 'Encrypt' })).toBeInTheDocument();
  });

  it('updates input text when typing', () => {
    render(<CaesarCipher />);
    
    const inputField = screen.getByLabelText('Text to Encrypt');
    fireEvent.change(inputField, { target: { value: 'hello' } });
    
    expect(inputField).toHaveValue('HELLO');
  });

  it('updates shift value when slider is moved', () => {
    render(<CaesarCipher />);
    
    const shiftSlider = screen.getByLabelText('Shift Value (0-25)');
    fireEvent.change(shiftSlider, { target: { value: '5' } });
    
    expect(screen.getByText('Shift: 5')).toBeInTheDocument();
  });

  it('encrypts text correctly with default shift (4)', () => {
    render(<CaesarCipher />);
    
    const inputField = screen.getByLabelText('Text to Encrypt');
    fireEvent.change(inputField, { target: { value: 'ABC' } });
    
    const encryptButton = screen.getByRole('button', { name: 'Encrypt' });
    fireEvent.click(encryptButton);
    
    // Fast-forward timers to complete animation
    act(() => {
      jest.advanceTimersByTime(1500); // 3 characters * 500ms
    });
    
    // With shift 4, 'ABC' should become 'EFG'
    const outputContainer = screen.getByLabelText('Encrypted Text');
    expect(outputContainer).toHaveTextContent('EFG');
  });

  it('encrypts text correctly with custom shift', () => {
    render(<CaesarCipher />);
    
    // Set shift to 5
    const shiftSlider = screen.getByLabelText('Shift Value (0-25)');
    fireEvent.change(shiftSlider, { target: { value: '5' } });
    
    // Input text
    const inputField = screen.getByLabelText('Text to Encrypt');
    fireEvent.change(inputField, { target: { value: 'XYZ' } });
    
    // Click encrypt
    const encryptButton = screen.getByRole('button', { name: 'Encrypt' });
    fireEvent.click(encryptButton);
    
    // Fast-forward timers to complete animation
    act(() => {
      jest.advanceTimersByTime(1500); // 3 characters * 500ms
    });
    
    // With shift 5, 'XYZ' should become 'CDE'
    const outputContainer = screen.getByLabelText('Encrypted Text');
    expect(outputContainer).toHaveTextContent('CDE');
  });

  it('preserves non-alphabetic characters', () => {
    render(<CaesarCipher />);
    
    // Set shift to 4 (default)
    const inputField = screen.getByLabelText('Text to Encrypt');
    fireEvent.change(inputField, { target: { value: 'A1B!C' } });
    
    const encryptButton = screen.getByRole('button', { name: 'Encrypt' });
    fireEvent.click(encryptButton);
    
    // Fast-forward timers to complete animation
    act(() => {
      jest.advanceTimersByTime(2500); // 5 characters * 500ms
    });
    
    // With shift 4, 'A1B!C' should become 'E1F!G'
    const outputContainer = screen.getByLabelText('Encrypted Text');
    expect(outputContainer).toHaveTextContent('E1F!G');
  });

  it('disables the encrypt button during animation', () => {
    render(<CaesarCipher />);
    
    const inputField = screen.getByLabelText('Text to Encrypt');
    fireEvent.change(inputField, { target: { value: 'HELLO' } });
    
    const encryptButton = screen.getByRole('button', { name: 'Encrypt' });
    fireEvent.click(encryptButton);
    
    // Button should be disabled and show "Encrypting..."
    expect(screen.getByRole('button', { name: 'Encrypting...' })).toBeDisabled();
    
    // Fast-forward timers to complete animation
    act(() => {
      jest.advanceTimersByTime(2500); // 5 characters * 500ms
    });
    
    // Button should be enabled again and show "Encrypt"
    expect(screen.getByRole('button', { name: 'Encrypt' })).toBeEnabled();
  });
}); 