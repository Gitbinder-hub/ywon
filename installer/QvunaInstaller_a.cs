using System;
using System.IO;
using System.IO.Compression;
using System.Diagnostics;
using System.Reflection;
using System.Windows.Forms;
using Microsoft.Win32;
namespace YwonInstaller {
 static class Program {
  [STAThread]
  static int Main(string[] args) {
   bool silent=false;
   foreach(var a in args) if(a=="--silent") silent=true;
   if(silent) return DoInstall(true,false,true);
   Application.EnableVisualStyles();
   Application.SetCompatibleTextRenderingDefault(false);
   var f=new InstallForm();
   Application.Run(f);
   return f.ExitCode;
  }
  public static string DefaultDir(){
   return Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),"Ywon","Ywon Companion");
  }
  public static int DoInstall(bool desktopShortcut,bool autostart,bool silent){
   return DoInstallTo(DefaultDir(),desktopShortcut,autostart,silent);
  }
  public static int DoInstallTo(string dir,bool desktopShortcut,bool autostart,bool silent){
   try{
    Stream s=null;
    foreach(var n in Assembly.GetExecutingAssembly().GetManifestResourceNames()){
     if(n.EndsWith("payload.zip")){ s=Assembly.GetExecutingAssembly().GetManifestResourceStream(n); break; }
    }
    if(s==null){ MessageBox.Show("Embedded payload not found.\nResources: "+string.Join(", ",Assembly.GetExecutingAssembly().GetManifestResourceNames()),"Ywon Companion",MessageBoxButtons.OK,MessageBoxIcon.Error); return 2; }
    Directory.CreateDirectory(dir);
    using(var zip=new ZipArchive(s,ZipArchiveMode.Read)){
     foreach(var e in zip.Entries){
      string full=Path.Combine(dir,e.FullName.Replace('/',Path.DirectorySeparatorChar));
      if(!full.StartsWith(dir,StringComparison.OrdinalIgnoreCase)) return 3;
      string fullDir=Path.GetDirectoryName(full);
      if(String.IsNullOrEmpty(e.Name)){
       Directory.CreateDirectory(full);
      }else{
       Directory.CreateDirectory(fullDir);
       e.ExtractToFile(full,true);
      }
     }
    }
    Stream us=null;
    foreach(var n in Assembly.GetExecutingAssembly().GetManifestResourceNames()){
     if(n.EndsWith("uninstall.exe")) us=Assembly.GetExecutingAssembly().GetManifestResourceStream(n);
    }
    string uninstallExe=Path.Combine(dir,"uninstall.exe");
    if(us!=null){
     using(us) using(var fs=new FileStream(uninstallExe,FileMode.Create,FileAccess.Write)){ us.CopyTo(fs); }
    }else{
     try{ File.Copy(Assembly.GetExecutingAssembly().Location,uninstallExe,true);}catch{}
    }
    string mainTarget=Path.Combine(dir,"START.cmd");
    string YwonLauncher=Path.Combine(dir,"Ywon.cmd");
    if(File.Exists(YwonLauncher)) mainTarget=YwonLauncher;
    else if(!File.Exists(mainTarget)) mainTarget=YwonLauncher;
    if(!File.Exists(YwonLauncher)){
     File.WriteAllText(YwonLauncher,"@echo off\r\nstart \"\" \""+Path.Combine(dir,"START.cmd")+"\"\r\n");
     mainTarget=YwonLauncher;
    }
    using(var k=Registry.CurrentUser.CreateSubKey(@"Software\Microsoft\Windows\CurrentVersion\Uninstall\YwonCompanion")){
     k.SetValue("DisplayName","Ywon Companion");
     k.SetValue("Publisher","Ywon");
     k.SetValue("DisplayVersion","0.0.6");
     k.SetValue("InstallLocation",dir);
     k.SetValue("UninstallString","\""+uninstallExe+"\"");
     k.SetValue("QuietUninstallString","\""+uninstallExe+"\" --silent");
     k.SetValue("NoModify",1,RegistryValueKind.DWord);
     k.SetValue("NoRepair",1,RegistryValueKind.DWord);
     k.SetValue("EstimatedSize",1024,RegistryValueKind.DWord);
     k.SetValue("DisplayIcon",mainTarget);
     k.SetValue("URLInfoAbout","https://Ywoom.local");
    }
    string startMenu=Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.Programs),"Ywon");
    Directory.CreateDirectory(startMenu);
    CreateShortcut(Path.Combine(startMenu,"Ywon.lnk"),mainTarget,dir,"Ywon Companion");
    CreateShortcut(Path.Combine(startMenu,"Uninstall Ywon Companion.lnk"),uninstallExe,dir,"Uninstall Ywon Companion");
    if(desktopShortcut){
     string desktop=Environment.GetFolderPath(Environment.SpecialFolder.DesktopDirectory);
     try{ CreateShortcut(Path.Combine(desktop,"Ywon Companion.lnk"),mainTarget,dir,"Ywon Companion"); }catch{}
    }
