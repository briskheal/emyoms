$envs = @{
  "DATABASE_URL" = "postgresql://neondb_owner:npg_bqJ3wQE8GWuX@ep-green-mountain-aonjketm-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
  "GOOGLE_SCRIPT_URL" = "https://script.google.com/macros/s/AKfycbzrQUKzOelvenARhZ1bUUnxzvDKB7Emu-gJwG9RCC9DaZtGskMbxngJ0JWbN8Zknt57QA/exec"
  "ADMIN_ID" = "EMYRIS"
  "ADMIN_PASSWORD" = "Omrutam@1306"
  "SUPER_DISTRIBUTOR_EMAIL" = "emyrisbio@gmail.com"
  "CLOUDINARY_CLOUD_NAME" = "dqtwbavrh"
  "CLOUDINARY_API_KEY" = "388217914358456"
  "CLOUDINARY_API_SECRET" = "lbXhWxezsDMjC8SK6IymIf0TN3M"
  "GEMINI_API_KEY" = "AIzaSyCOgLXNsbbUdXkFZA5iGTyRS5iFgLLDFbE"
}

foreach ($key in $envs.Keys) {
  $val = $envs[$key]
  foreach ($target in @("production", "preview", "development")) {
    Write-Host "Adding $key to $target..."
    $proc = Start-Process -FilePath "npx.cmd" -ArgumentList "-y", "vercel", "env", "add", $key, $target, "--value", """$val""", "--yes", "--scope", "briskheal1306", "--force" -NoNewWindow -PassThru -Wait
    if ($proc.ExitCode -ne 0) {
      Write-Host "Warning: Non-zero exit code for $key in $target"
    }
  }
}
Write-Host "Done!"
