# Deployment Setup Guide

## Supabase Storage Configuration

### Step 1: Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

This will install `supabase` and `python-dotenv` packages.

### Step 2: Add Environment Variables

Add these to your `backend/.env` file:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
SUPABASE_STORAGE_BUCKET=student-photos

# Enable Supabase Storage (set to True for production)
USE_SUPABASE_STORAGE=True
```

**Where to find these:**
- **SUPABASE_URL**: Supabase Dashboard → Settings → API → Project URL
- **SUPABASE_SERVICE_ROLE_KEY**: Supabase Dashboard → Settings → API → Service Role Key (secret)
- **SUPABASE_STORAGE_BUCKET**: The bucket name you created (default: `student-photos`)

### Step 3: Upload Photos to Supabase Storage

1. Go to Supabase Dashboard → Storage
2. Open your `student-photos` bucket
3. Upload all photos from `backend/media/student_photos/`
4. Make sure filenames match what's in the database (e.g., `student_123_profile.jpg`)

### Step 4: Update Database Records

Run the script to update database records with Supabase URLs:

```bash
cd backend
python update_photo_urls_to_supabase.py
```

This will:
- Find all students with photos
- Update database records to use Supabase Storage URLs
- Preserve all existing data

### Step 5: Test Locally

1. Set `USE_SUPABASE_STORAGE=True` in `.env`
2. Restart Django server
3. Check if photos load correctly in the frontend

### Step 6: Deploy to Production

#### Render.com (Backend)

1. Add environment variables in Render dashboard:
   - `USE_SUPABASE_STORAGE=True`
   - `SUPABASE_URL=your-url`
   - `SUPABASE_SERVICE_ROLE_KEY=your-key`
   - `SUPABASE_STORAGE_BUCKET=student-photos`

2. Deploy your Django app

#### Vercel (Frontend)

1. Add environment variables:
   - `NEXT_PUBLIC_API_URL=your-render-backend-url`

2. Deploy your Next.js app

## How It Works

### Development (Local)
- `USE_SUPABASE_STORAGE=False` → Uses local filesystem
- Photos stored in `backend/media/student_photos/`
- Served via Django's development server

### Production (Deployed)
- `USE_SUPABASE_STORAGE=True` → Uses Supabase Storage
- Photos stored in Supabase Storage bucket
- Served via Supabase CDN (fast, reliable)
- Works on stateless platforms (Render, Vercel)

## Troubleshooting

### Photos Not Loading
1. Check `USE_SUPABASE_STORAGE` is set correctly
2. Verify Supabase credentials in `.env`
3. Check bucket name matches `SUPABASE_STORAGE_BUCKET`
4. Ensure bucket is set to "Public"
5. Verify photos are uploaded to Supabase Storage

### Database URLs Not Updated
1. Run `update_photo_urls_to_supabase.py` script
2. Check database records in pgAdmin
3. Verify photo filenames match between database and Supabase

### Upload Errors
1. Check Supabase Storage bucket permissions
2. Verify `SUPABASE_SERVICE_ROLE_KEY` has write access
3. Check file size limits in bucket settings

