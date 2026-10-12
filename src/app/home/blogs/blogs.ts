import { Component, AfterViewInit, ElementRef, ViewChildren, QueryList, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { gsap } from 'gsap';
import { Nav2 } from '../nav-2/nav-2';

interface Comment {
  id: number;
  author: string;
  time: string;
  text: string;
}

interface BlogPost {
  id: number;
  author: string;
  handle: string;
  category: string;
  date: string;
  content: string[];
  imageUrl: string;
  likes: number;
  liked: boolean;
  bookmarked: boolean;
  comments: Comment[];
}

@Component({
  selector: 'app-blogs',
  standalone: true,
  imports: [CommonModule, Nav2],
  templateUrl: './blogs.html',
  styleUrl: './blogs.css',
})
export class Blog implements AfterViewInit {
  like = 'like.png';
  likeActive = 'like-active.png';
  share = 'share.png';
  bookmark = 'bookmark.png';
  bookmarkActive = 'bookmark-active.png';

  currentMainTab: 'blogs' | 'store' | 'home' = 'blogs';
  currentFilter: 'latest' | 'popular' | 'bookmarked' | 'all' = 'latest';
  toastMessage: string | null = null;
  private toastTimeout: any;

  @ViewChildren('blogArticle') blogArticles!: QueryList<ElementRef>;

  constructor(private router: Router, private cdr: ChangeDetectorRef) {}

  ngAfterViewInit(): void {
    this.animateBlogsIn();
  }

  animateBlogsIn(): void {
    if (this.blogArticles && this.blogArticles.length > 0) {
      gsap.fromTo(
        this.blogArticles.map(el => el.nativeElement),
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.4, stagger: 0.1, ease: 'power2.out' }
      );
    }
  }

  goHome() {
    this.router.navigate(['']);
  }
  
  goToStore() {
    this.router.navigate(['/store']);
  }

  blogs: BlogPost[] = [
    {
      id: 1,
      author: 'A-plus Motors LTD',
      handle: '@A-plus motors',
      category: 'latest',
      date: 'Today',
      content: [
        "Car culture is shifting into high gear! From sleek electric crossovers delivering instant torque to timeless manual sports cars keeping the pure driving spirit alive, there's never been a more exciting time to be behind the wheel.",
        "What is your ultimate dream ride? Drop your favorite pick in the comments below!"
      ],
      imageUrl: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80',
      likes: 1240,
      liked: false,
      bookmarked: false,
      comments: [
        { id: 101, author: 'Marcus V.', time: '2h ago', text: 'Jaguar E-Type Lightweight forever! Nothing beats that British racing green curve.' },
        { id: 102, author: 'Sarah Jenkins', time: '45m ago', text: 'Give me a classic Porsche 911 Singer restomod any day of the week!' }
      ]
    },
    {
      id: 2,
      author: 'A-plus Motors LTD',
      handle: '@A-plus motors',
      category: 'popular',
      date: '2 days ago',
      content: [
        "Restoring British racing green icons requires meticulous attention to original factory specifications. Every bolt, wire harness, and aluminum panel tells a story of decades past.",
        "Are you a purist when it comes to classic restorations, or do you prefer modern restomods with upgraded suspension and fuel injection?"
      ],
      imageUrl: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80',
      likes: 3420,
      liked: true,
      bookmarked: true,
      comments: [
        { id: 201, author: 'David K.', time: '1d ago', text: 'Purist all the way! Keep the original matching numbers intact.' }
      ]
    },
    {
      id: 3,
      author: 'A-plus Motors LTD',
      handle: '@A-plus motors',
      category: 'all',
      date: '1 week ago',
      content: [
        "The sound of a naturally aspirated V12 echoing through mountain passes is a symphony that never gets old. Modern turbocharging is efficient, but nothing replaces raw mechanical acoustics.",
        "What mountain pass or coastal highway is at the very top of your bucket list?"
      ],
      imageUrl: 'https://images.unsplash.com/photo-1544829099-b9a0c07fad1a?auto=format&fit=crop&w=1200&q=80',
      likes: 890,
      liked: false,
      bookmarked: false,
      comments: [
        { id: 301, author: 'Elena Rostova', time: '3d ago', text: 'Stelvio Pass in Italy! Absolute bucket list perfection.' }
      ]
    }
  ];

  get filteredBlogs(): BlogPost[] {
    if (this.currentFilter === 'bookmarked') {
      return this.blogs.filter(b => b.bookmarked);
    }
    if (this.currentFilter === 'popular') {
      return [...this.blogs].sort((a, b) => b.likes - a.likes);
    }
    return this.blogs;
  }

  setMainTab(tab: 'blogs' | 'store' | 'home'): void {
    this.currentMainTab = tab;
  }

  setFilter(filter: 'latest' | 'popular' | 'bookmarked' | 'all'): void {
    if (this.currentFilter === filter) return;

    // Fade out slightly before switching filters
    if (this.blogArticles && this.blogArticles.length > 0) {
      gsap.to(this.blogArticles.map(el => el.nativeElement), {
        opacity: 0,
        y: -10,
        duration: 0.15,
        onComplete: () => {
          this.currentFilter = filter;
          this.cdr.detectChanges();
          this.animateBlogsIn();
        }
      });
    } else {
      this.currentFilter = filter;
    }
  }

  toggleLike(id: number): void {
    const blog = this.blogs.find(b => b.id === id);
    if (blog) {
      blog.liked = !blog.liked;
      blog.likes += blog.liked ? 1 : -1;
      this.showToast(blog.liked ? 'Added to liked posts' : 'Removed from liked posts');
    }
  }

  toggleBookmark(id: number): void {
    const blog = this.blogs.find(b => b.id === id);
    if (blog) {
      blog.bookmarked = !blog.bookmarked;
      this.showToast(blog.bookmarked ? 'Blog bookmarked' : 'Bookmark removed');
    }
  }

  shareBlog(blog: BlogPost): void {
    if (navigator.share) {
      navigator.share({
        title: blog.author,
        text: blog.content[0],
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      this.showToast('Link copied to clipboard!');
    }
  }

  addComment(blogId: number, event: Event): void {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const input = form.querySelector('input') as HTMLInputElement;
    const text = input.value.trim();
    if (!text) return;

    const blog = this.blogs.find(b => b.id === blogId);
    if (blog) {
      blog.comments.unshift({
        id: Date.now(),
        author: 'You',
        time: 'Just now',
        text: text
      });
      input.value = '';
      this.showToast('Comment posted!');
    }
  }

  showToast(msg: string): void {
    this.toastMessage = msg;
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }
    this.toastTimeout = setTimeout(() => {
      if (this.toastMessage === msg) {
        this.toastMessage = null;
      }
    }, 3000);
  }
}