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
   bool autostart=false;
   bool noDesktop=false;
   foreach(var a in args){
    if(a=="--silent") silent=true;
    else if(a=="--autostart") autostart=true;
    else if(a=="--no-desktop") noDesktop=true;
    else if(a=="--no-autostart") autostart=false;
   }
   if(silent) return DoInstall(!noDesktop,autostart,true);
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
    // Main target is native tray window — real app, not bare terminal
    string trayExe=Path.Combine(dir,"QvunaTray.exe");
    string startCmd=Path.Combine(dir,"START.cmd");
    string YwonLauncher=Path.Combine(dir,"Ywon.cmd");
    // Ensure launchers exist for fallback
    if(!File.Exists(YwonLauncher)){
     File.WriteAllText(YwonLauncher,"@echo off\r\nif exist \"%~dp0QvunaTray.exe\" ( start \"\" \"%~dp0QvunaTray.exe\" & exit /b )\r\nstart \"\" \""+Path.Combine(dir,"START.cmd")+"\"\r\n");
    }
    string mainTarget;
    if(File.Exists(trayExe)) mainTarget=trayExe;
    else if(File.Exists(YwonLauncher)) mainTarget=YwonLauncher;
    else mainTarget=startCmd;
    using(var k=Registry.CurrentUser.CreateSubKey(@"Software\Microsoft\Windows\CurrentVersion\Uninstall\YwonCompanion")){
     k.SetValue("DisplayName","Ywoom");
     k.SetValue("Publisher","Ywoom");
     k.SetValue("DisplayVersion","3.1");
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
    if(autostart){
     try{
      using(var rk=Registry.CurrentUser.CreateSubKey(@"Software\Microsoft\Windows\CurrentVersion\Run")){
       rk.SetValue("YwonCompanion","\""+mainTarget+"\"");
      }
     }catch{}
    }else{
     try{
      using(var rk=Registry.CurrentUser.OpenSubKey(@"Software\Microsoft\Windows\CurrentVersion\Run",true)){
       if(rk!=null) rk.DeleteValue("YwonCompanion",false);
      }
     }catch{}
    }
    if(!silent){
     MessageBox.Show("Ywon Companion установлен в:\n"+dir+"\n\nЯрлык на рабочем столе создан.\nАвтозапуск выключен (можно включить в установщике или через Параметры).\n\nЗапустите Ywon.lnk из меню Пуск или с рабочего стола.\nSmartScreen покажет предупреждение для неподписанного пилота — это ожидаемо.", "Ywon Companion",MessageBoxButtons.OK,MessageBoxIcon.Information);
     try{ Process.Start("explorer.exe","\""+dir+"\""); }catch{}
    }
    return 0;
   }catch(Exception ex){
    MessageBox.Show("Install failed:\n"+ex.Message+"\n"+ex.StackTrace,"Ywon Companion",MessageBoxButtons.OK,MessageBoxIcon.Error);
    return 2;
   }
  }
  static void CreateShortcut(string lnkPath,string target,string workDir,string desc){
   try{
    var shell=Activator.CreateInstance(Type.GetTypeFromProgID("WScript.Shell"));
    var sc=shell.GetType().InvokeMember("CreateShortcut",System.Reflection.BindingFlags.InvokeMethod,null,shell,new object[]{lnkPath});
    sc.GetType().InvokeMember("TargetPath",System.Reflection.BindingFlags.SetProperty,null,sc,new object[]{target});
    sc.GetType().InvokeMember("WorkingDirectory",System.Reflection.BindingFlags.SetProperty,null,sc,new object[]{workDir});
    sc.GetType().InvokeMember("Description",System.Reflection.BindingFlags.SetProperty,null,sc,new object[]{desc});
    sc.GetType().InvokeMember("IconLocation",System.Reflection.BindingFlags.SetProperty,null,sc,new object[]{target});
    sc.GetType().InvokeMember("Save",System.Reflection.BindingFlags.InvokeMethod,null,sc,null);
   }catch(Exception ex){
    try{ File.WriteAllText(lnkPath+".url","[InternetShortcut]\r\nURL=file:///"+target.Replace("\\","/")+"\r\n"); }catch{ throw new Exception("Shortcut failed: "+ex.Message,ex); }
   }
  }
 }
 class InstallForm:Form{
  public int ExitCode=0;
  CheckBox cbDesktop,cbAutostart;
  TextBox tbDir;
  public InstallForm(){
   Text="Ywoom 3.1 — Установка";
   Width=560; Height=430; FormBorderStyle=FormBorderStyle.FixedDialog; MaximizeBox=false; MinimizeBox=false; StartPosition=FormStartPosition.CenterScreen;
   var lbl1=new Label(){Text="Ywoom 3.1 — локальный завод контента.\nПоставит Ywoom на этот компьютер (без админа).", AutoSize=false, Width=520, Height=50, Left=16, Top=12};
   var lblWarn=new Label(){Text="Неподписанный EXE: SmartScreen покажет предупреждение — это нормально.", AutoSize=false, Width=520, Height=26, Left=16, Top=58, ForeColor=System.Drawing.Color.DarkRed};
   var lblDir=new Label(){Text="Папка установки (per-user, без админа):", Left=16, Top=100, Width=300};
   tbDir=new TextBox(){Left=16, Width=460, Top=118, Text=Program.DefaultDir()};
   var btnBrowse=new Button(){Text="...", Left=482, Top=117, Width=54};
   btnBrowse.Click+=(s,e)=>{
    var dlg=new FolderBrowserDialog(){Description="Выберите папку", SelectedPath=tbDir.Text};
    if(dlg.ShowDialog()==DialogResult.OK) tbDir.Text=Path.Combine(dlg.SelectedPath,"Ywon Companion");
   };
   cbDesktop=new CheckBox(){Text="Ярлык на рабочем столе (вкл по умолчанию)", Left=16, Top=150, Width=500, Checked=true};
   cbAutostart=new CheckBox(){Text="Автозапуск при входе (выкл по умолчанию)", Left=16, Top=174, Width=500, Checked=false};
   var lblInfo=new Label(){Text="Создаст ярлык Ywoom в меню Пуск и на рабочем столе.\nРусская озвучка — отдельно: SETUP-ASR.cmd после установки.", AutoSize=false, Width=520, Height=40, Left=16, Top=204};
   var btnInstall=new Button(){Text="Установить", Left=300, Top=266, Width=110, Height=30};
   var btnCancel=new Button(){Text="Отмена", Left=420, Top=266, Width=110, Height=30, DialogResult=DialogResult.Cancel};
   var progress=new ProgressBar(){Left=16, Top=310, Width=514, Height=18, Style=ProgressBarStyle.Blocks};
   var lblStatus=new Label(){Left=16, Top=334, Width=514, Height=18, Text=""};
   btnInstall.Click+=(s,e)=>{
    string dir=tbDir.Text.Trim();
    if(String.IsNullOrWhiteSpace(dir)){ MessageBox.Show("Укажите папку установки."); return; }
    if(dir.Length>140){ MessageBox.Show("Путь слишком длинный — выберите короткий (до 140)."); return; }
    btnInstall.Enabled=false; btnCancel.Enabled=false; progress.Style=ProgressBarStyle.Marquee; lblStatus.Text="Копирование…"; Refresh();
    int code=Program.DoInstallTo(dir,cbDesktop.Checked,cbAutostart.Checked,false);
    progress.Style=ProgressBarStyle.Blocks; progress.Value=100;
    if(code==0){ lblStatus.Text="Готово."; ExitCode=0; Close(); }else{ lblStatus.Text="Ошибка "+code; btnInstall.Enabled=true; btnCancel.Enabled=true; ExitCode=code; }
   };
   Controls.AddRange(new Control[]{lbl1,lblWarn,lblDir,tbDir,btnBrowse,cbDesktop,cbAutostart,lblInfo,btnInstall,btnCancel,progress,lblStatus});
   CancelButton=btnCancel;
  }
 }
}
