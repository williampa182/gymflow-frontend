cd C:\proyectos\gymflow\gymflow-frontend
npm run build 2>&1 | Out-File -FilePath build_output.log -Encoding utf8
Write-Output "BUILD DONE"
