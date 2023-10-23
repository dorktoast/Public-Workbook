@echo off
title Adobe Killer
echo You are about to terminate all Adobe processes and services. Please close all Adobe programs before proceeding.
pause

net stop AdobeUpdateService /y
taskkill /IM AdobeUpdateService.exe /F
taskkill /IM "Adobe Installer.exe" /F
taskkill /IM "Adobe Desktop Service.exe" /F
taskkill /IM "AdobeNotificationClient.exe" /F
taskkill /IM "AcrobatNotificationClient.exe" /F
taskkill /IM "AdobeIPCBroker.exe" /F
taskkill /IM "Adobe CEF Helper.exe" /F
taskkill /IM CCLibrary.exe /F
taskkill /IM armsvc.exe /F
taskkill /IM AGMService.exe /F
taskkill /IM AdobeCollabSync.exe /F
taskkill /IM CCXProcess.exe /F
taskkill /IM CoreSync.exe /F
taskkill /IM "Adobe Crash Processor.exe" /F
