@echo off
echo Adding environment variables...

:: DATABASE_URL
call npx.cmd -y vercel env add DATABASE_URL production --value "postgresql://neondb_owner:npg_bqJ3wQE8GWuX@ep-green-mountain-aonjketm-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require" --yes --scope briskheal1306 --force
call npx.cmd -y vercel env add DATABASE_URL preview --value "postgresql://neondb_owner:npg_bqJ3wQE8GWuX@ep-green-mountain-aonjketm-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require" --yes --scope briskheal1306 --force
call npx.cmd -y vercel env add DATABASE_URL development --value "postgresql://neondb_owner:npg_bqJ3wQE8GWuX@ep-green-mountain-aonjketm-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require" --yes --scope briskheal1306 --force

:: GOOGLE_SCRIPT_URL
call npx.cmd -y vercel env add GOOGLE_SCRIPT_URL production --value "https://script.google.com/macros/s/AKfycbzrQUKzOelvenARhZ1bUUnxzvDKB7Emu-gJwG9RCC9DaZtGskMbxngJ0JWbN8Zknt57QA/exec" --yes --scope briskheal1306 --force
call npx.cmd -y vercel env add GOOGLE_SCRIPT_URL preview --value "https://script.google.com/macros/s/AKfycbzrQUKzOelvenARhZ1bUUnxzvDKB7Emu-gJwG9RCC9DaZtGskMbxngJ0JWbN8Zknt57QA/exec" --yes --scope briskheal1306 --force
call npx.cmd -y vercel env add GOOGLE_SCRIPT_URL development --value "https://script.google.com/macros/s/AKfycbzrQUKzOelvenARhZ1bUUnxzvDKB7Emu-gJwG9RCC9DaZtGskMbxngJ0JWbN8Zknt57QA/exec" --yes --scope briskheal1306 --force

:: ADMIN_ID
call npx.cmd -y vercel env add ADMIN_ID production --value "EMYRIS" --yes --scope briskheal1306 --force
call npx.cmd -y vercel env add ADMIN_ID preview --value "EMYRIS" --yes --scope briskheal1306 --force
call npx.cmd -y vercel env add ADMIN_ID development --value "EMYRIS" --yes --scope briskheal1306 --force

:: ADMIN_PASSWORD
call npx.cmd -y vercel env add ADMIN_PASSWORD production --value "Omrutam@1306" --yes --scope briskheal1306 --force
call npx.cmd -y vercel env add ADMIN_PASSWORD preview --value "Omrutam@1306" --yes --scope briskheal1306 --force
call npx.cmd -y vercel env add ADMIN_PASSWORD development --value "Omrutam@1306" --yes --scope briskheal1306 --force

:: SUPER_DISTRIBUTOR_EMAIL
call npx.cmd -y vercel env add SUPER_DISTRIBUTOR_EMAIL production --value "emyrisbio@gmail.com" --yes --scope briskheal1306 --force
call npx.cmd -y vercel env add SUPER_DISTRIBUTOR_EMAIL preview --value "emyrisbio@gmail.com" --yes --scope briskheal1306 --force
call npx.cmd -y vercel env add SUPER_DISTRIBUTOR_EMAIL development --value "emyrisbio@gmail.com" --yes --scope briskheal1306 --force

:: CLOUDINARY_CLOUD_NAME
call npx.cmd -y vercel env add CLOUDINARY_CLOUD_NAME production --value "dqtwbavrh" --yes --scope briskheal1306 --force
call npx.cmd -y vercel env add CLOUDINARY_CLOUD_NAME preview --value "dqtwbavrh" --yes --scope briskheal1306 --force
call npx.cmd -y vercel env add CLOUDINARY_CLOUD_NAME development --value "dqtwbavrh" --yes --scope briskheal1306 --force

:: CLOUDINARY_API_KEY
call npx.cmd -y vercel env add CLOUDINARY_API_KEY production --value "388217914358456" --yes --scope briskheal1306 --force
call npx.cmd -y vercel env add CLOUDINARY_API_KEY preview --value "388217914358456" --yes --scope briskheal1306 --force
call npx.cmd -y vercel env add CLOUDINARY_API_KEY development --value "388217914358456" --yes --scope briskheal1306 --force

:: CLOUDINARY_API_SECRET
call npx.cmd -y vercel env add CLOUDINARY_API_SECRET production --value "lbXhWxezsDMjC8SK6IymIf0TN3M" --yes --scope briskheal1306 --force
call npx.cmd -y vercel env add CLOUDINARY_API_SECRET preview --value "lbXhWxezsDMjC8SK6IymIf0TN3M" --yes --scope briskheal1306 --force
call npx.cmd -y vercel env add CLOUDINARY_API_SECRET development --value "lbXhWxezsDMjC8SK6IymIf0TN3M" --yes --scope briskheal1306 --force

:: GEMINI_API_KEY
call npx.cmd -y vercel env add GEMINI_API_KEY production --value "AIzaSyCOgLXNsbbUdXkFZA5iGTyRS5iFgLLDFbE" --yes --scope briskheal1306 --force
call npx.cmd -y vercel env add GEMINI_API_KEY preview --value "AIzaSyCOgLXNsbbUdXkFZA5iGTyRS5iFgLLDFbE" --yes --scope briskheal1306 --force
call npx.cmd -y vercel env add GEMINI_API_KEY development --value "AIzaSyCOgLXNsbbUdXkFZA5iGTyRS5iFgLLDFbE" --yes --scope briskheal1306 --force

echo Done!
