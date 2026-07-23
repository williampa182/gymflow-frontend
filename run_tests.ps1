cd C:\proyectos\gymflow\gymflow-frontend
npm test 2>&1 | Out-File -FilePath test_output.log -Encoding utf8
Write-Output "TESTS DONE"
