import { Component, EventEmitter, Output, NgZone, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Type definitions for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './search.html',
  styleUrl: './search.css'
})
export class Search implements OnInit {
  // Define explicitly as boolean so $event is recognized as boolean in menu.html
  @Output() searchStateChange = new EventEmitter<boolean>();

  isOpen = false;
  searchQuery = '';
  isListening = false;

  private recognition: any;

  constructor(private ngZone: NgZone) {}

  ngOnInit(): void {
    this.initVoiceRecognition();
  }

  openSearch(): void {
    this.isOpen = true;
    this.searchStateChange.emit(this.isOpen);
  }

  closeSearch(): void {
    if (this.isListening) {
      this.stopVoiceSearch();
    }
    this.isOpen = false;
    this.searchStateChange.emit(this.isOpen);
  }

  /**
   * Initialize Web Speech API for Voice Search
   */
  private initVoiceRecognition(): void {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.lang = 'en-US';

      this.recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        this.ngZone.run(() => {
          this.searchQuery = transcript;
          this.isListening = false;
          this.onSearch();
        });
      };

      this.recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        this.ngZone.run(() => {
          this.isListening = false;
        });
      };

      this.recognition.onend = () => {
        this.ngZone.run(() => {
          this.isListening = false;
        });
      };
    } else {
      console.warn('Web Speech API is not supported in this browser.');
    }
  }

  /**
   * Toggle Voice Search start/stop
   */
  toggleVoiceSearch(): void {
    if (!this.recognition) {
      alert('Voice search is not supported in this browser.');
      return;
    }

    if (this.isListening) {
      this.stopVoiceSearch();
    } else {
      this.startVoiceSearch();
    }
  }

  private startVoiceSearch(): void {
    this.recognition.start();
    this.isListening = true;
  }

  private stopVoiceSearch(): void {
    this.recognition.stop();
    this.isListening = false;
  }

  /**
   * Execute search action
   */
  onSearch(): void {
    if (this.searchQuery.trim()) {
      console.log('Searching for:', this.searchQuery);
      // Place your search navigation or filter logic here
    }
  }
}