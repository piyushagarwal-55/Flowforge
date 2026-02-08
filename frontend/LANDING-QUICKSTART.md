# FlowForge Landing Page - Quick Start Guide

## 🚀 Get Started in 3 Steps

### 1. Start the Development Server
```bash
cd frontend
npm run dev
```

### 2. Navigate to Landing Page
Open your browser and go to:
```
http://localhost:5000/landing
```

### 3. Test the Demo Section
Scroll down to the "See It In Action" section and try:
- Click an example prompt
- Or type your own: "Create a signup API with email validation"
- Watch the workflow generate in real-time

---

## 🎯 What You'll See

### Hero Section
- Large headline: "AI-Native Backend Built in Conversation"
- Two CTAs: "Start Building" and "Watch Demo"
- Animated background with radial glows

### Problem Section
- 3 cards explaining backend development pain points
- Red accents for problems
- Hover effects on cards

### Solution Section
- Emerald glow background
- Visual workflow preview
- Glass morphism panel

### Features Section
- 4 feature cards:
  1. Generative Workflows
  2. Conversational Mutation
  3. Runtime Execution
  4. Backend Explanation
- Icon rotation on hover

### Technical Demo Section ⭐
- **LIVE DEMO** of FlowForge
- Real WorkflowPage component embedded
- Try building workflows without signing up
- Example prompts provided

### Final CTA Section
- Strong call to action
- Two buttons: "Get Started Free" and "View on GitHub"

---

## 🧪 Testing Checklist

### Visual Tests
- [ ] Dark theme consistent throughout
- [ ] All text readable (white opacity hierarchy)
- [ ] Emerald accents for success
- [ ] Red accents for problems
- [ ] Blue accents for info
- [ ] Smooth animations on scroll
- [ ] No layout shift

### Interaction Tests
- [ ] "Start Building" button links to `/`
- [ ] "Watch Demo" button scrolls to demo section
- [ ] Cards lift on hover
- [ ] Icons rotate on hover
- [ ] Scroll indicator animates
- [ ] Demo section loads WorkflowPage

### Performance Tests
- [ ] Page loads in <3 seconds
- [ ] Animations run at 60fps
- [ ] Demo section lazy loads
- [ ] No console errors
- [ ] Mobile responsive

### Demo Section Tests
- [ ] WorkflowPage loads correctly
- [ ] Example prompts work
- [ ] Can type custom prompts
- [ ] Workflows generate visually
- [ ] Loading states show properly

---

## 🐛 Troubleshooting

### Landing Page Doesn't Load
**Problem**: 404 error at `/landing`
**Solution**: Make sure you're running `npm run dev` from the `frontend` directory

### Demo Section Shows Loading Forever
**Problem**: WorkflowPage component not loading
**Solution**: 
1. Check if backend is running (`cd backend && npm run dev`)
2. Check browser console for errors
3. Verify `NEXT_PUBLIC_BACKEND_URL` in `.env.local`

### Animations Not Smooth
**Problem**: Choppy animations
**Solution**:
1. Close other browser tabs
2. Check if GPU acceleration is enabled
3. Try in Chrome/Edge (best performance)

### Mobile Layout Broken
**Problem**: Layout doesn't stack vertically
**Solution**: Clear browser cache and reload

---

## 📱 Mobile Testing

### Test on Different Devices
1. **Desktop**: Full layout with all features
2. **Tablet**: Stacked layout, reduced spacing
3. **Mobile**: Single column, smaller text

### Chrome DevTools
1. Open DevTools (F12)
2. Click device toolbar icon
3. Test different screen sizes:
   - iPhone SE (375px)
   - iPhone 12 Pro (390px)
   - iPad (768px)
   - Desktop (1280px)

---

## 🎨 Design System Reference

### Colors (from ui-map.ts)
- **Background**: `bg-gradient-to-br from-[#0a0a0a] via-[#111] to-[#0a0a0a]`
- **Card**: `bg-white/[0.05]`
- **Border**: `border-white/[0.06]`
- **Text Primary**: `text-white/90`
- **Text Secondary**: `text-white/70`
- **Emerald**: `text-emerald-400`
- **Red**: `text-red-400`
- **Blue**: `text-blue-200`

### Typography
- **H1**: `text-5xl md:text-7xl font-bold`
- **H2**: `text-4xl font-bold`
- **H3**: `text-lg font-semibold`
- **Body**: `text-sm text-white/80`

### Spacing
- **Section**: `py-24` (desktop), `py-16` (mobile)
- **Card**: `p-6` or `p-8`
- **Gap**: `gap-4` or `gap-6`

---

## 🔧 Customization

### Change Hero Headline
Edit `frontend/app/landing/page.tsx`:
```tsx
<h1>
  Your New Headline
  <br />
  <span className="text-white/60">Your Subheadline</span>
</h1>
```

### Add New Feature Card
Edit `frontend/app/landing/page.tsx`:
```tsx
<FeatureCard
  icon={YourIcon}
  title="Your Feature"
  description="Your description"
  delay={0.4}
/>
```

### Change CTA Links
Edit `frontend/app/landing/page.tsx`:
```tsx
<Link href="/your-route">
  <button>Your CTA</button>
</Link>
```

---

## 📊 Performance Optimization

### Lighthouse Audit
1. Open Chrome DevTools
2. Go to Lighthouse tab
3. Run audit for:
   - Performance
   - Accessibility
   - Best Practices
   - SEO

### Target Scores
- **Performance**: >90
- **Accessibility**: >90
- **Best Practices**: >90
- **SEO**: >90

### Common Issues
- **Large images**: Use Next.js Image component
- **Unused JavaScript**: Already optimized with dynamic imports
- **Layout shift**: Already prevented with fixed heights

---

## 🎯 Next Steps

### Before Demo
1. ✅ Test all sections
2. ✅ Verify animations
3. ✅ Test demo section
4. ✅ Mobile responsive check
5. ✅ Performance audit

### For Hackathon
1. Add meta tags for SEO
2. Add Open Graph images
3. Add analytics tracking
4. Test on multiple browsers
5. Record demo video

### Post-Hackathon
1. Add testimonials
2. Add pricing section
3. Add FAQ section
4. Add blog preview
5. Add changelog

---

## 📚 Documentation

- **Component Docs**: `frontend/components/landing/README.md`
- **Implementation**: `frontend/internal/LANDING-IMPLEMENTATION.md`
- **Strategy**: `frontend/internal/landing-page-strategy.md`
- **UI Map**: `frontend/internal/ui-map.ts`

---

## 🆘 Need Help?

### Common Questions

**Q: Can I change the colors?**
A: No. All colors come from `ui-map.ts`. Maintain FlowForge's dark identity.

**Q: Can I add new sections?**
A: Yes, but follow the same pattern: AnimatedSection + ui-map tokens.

**Q: Can I use different animations?**
A: Yes, but keep them subtle. Only `opacity` and `translateY`.

**Q: Can I remove the demo section?**
A: No. The demo section is the hackathon differentiator.

---

## ✅ Ready to Ship

The landing page is **production-ready**. Test it, demo it, ship it.

**May the Force (of Generative UI) be with you!** ⚡

---

**Built for The UI Strikes Back Hackathon**
