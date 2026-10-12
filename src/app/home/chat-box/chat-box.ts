import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-chat-box',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './chat-box.html',
  styleUrl: './chat-box.css',
})
export class ChatBox {
  @Input() isOpen = false;

  openFaq() {
    // Add your FAQ navigation or modal trigger logic here
    console.log('FAQ clicked');
  }

  openContact() {
    // Add your Contact navigation or modal trigger logic here
    console.log('Contact clicked');
  }
}