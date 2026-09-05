@echo off
title Github Upload
echo Write Commit Name
set /p commit= ">>"
git add .
git commit -m "%commit%"
git push
:1
echo 명령어를 입력하세요.
set /p command= ">>"
%command%
goto 1