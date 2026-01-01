del /F /Q deploy.zip
xcopy .next\standalone deploy\ /E /I /Y
xcopy .next\static deploy\.next\static\ /E /I /Y
xcopy public deploy\public\ /E /I /Y
copy .env deploy\
@echo off
powershell -command "Compress-Archive -Path 'deploy\*' -DestinationPath 'deploy.zip'"
scp deploy.zip root@albahero.com:/app/basic/nextjs_basic/
del /F /Q deploy.zip