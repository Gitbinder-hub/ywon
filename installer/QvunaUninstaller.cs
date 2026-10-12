using System;
using System.IO;
using Microsoft.Win32;
using System.Windows.Forms;
namespace YwonUninstaller {
 static class Program {
  [STAThread]
  static int Main(string[] args){
   bool silent=false;
   foreach(var a in args) if(a=="--silent") silent=true;
   try{
    string dir=Path.GetDirectoryName(System.Reflection.Assembly.GetExecutingAssembly().Location);
    string installDir=dir;
    if(!silent){
     var r=MessageBox.Show("Удалить Ywon Companion?\n\nБудут удалены ярлыки, запись в Параметры и папка:\n"+installDir+"\n\nЛокальная ASR-среда (если была) не удаляется автоматически.\nНажмите Да для удаления.", "Ywon Companion", MessageBoxButtons.YesNo, MessageBoxIcon.Question);
     if(r!=DialogResult.Yes) return 0;
    }
    try{
     string startMenu=Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.Programs),"Ywon");
     string lnk1=Path.Combine(startMenu,"Ywon.lnk");
     string lnk2=Path.Combine(startMenu,"Uninstall Ywon Companion.lnk");
     if(File.Exists(lnk1)) File.Delete(lnk1);
     if(File.Exists(lnk2)) File.Delete(lnk2);
     if(Directory.Exists(startMenu) && Directory.GetFiles(startMenu).Length==0 && Directory.GetDirectories(startMenu).Length==0) Directory.Delete(startMenu);
    }catch{}
    try{
     string desktop=Environment.GetFolderPath(Environment.SpecialFolder.DesktopDirectory);
     string dlnk=Path.Combine(desktop,"Ywon Companion.lnk");
     if(File.Exists(dlnk)) File.Delete(dlnk);
     if(File.Exists(dlnk+".url")) File.Delete(dlnk+".url");
    }catch{}
    try{
     using(var rk=Registry.CurrentUser.OpenSubKey(@"Software\Microsoft\Windows\CurrentVersion\Run",true)){
      if(rk!=null) rk.DeleteValue("YwonCompanion",false);
     }
    }catch{}
    try{ Registry.CurrentUser.DeleteSubKeyTree(@"Software\Microsoft\Windows\CurrentVersion\Uninstall\YwonCompanion",false); }catch{}
    try{
     string baseDir=Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),"Ywon");
     if(Directory.Exists(baseDir)){
      bool empty=true;
      foreach(var e in Directory.GetFileSystemEntries(baseDir)) { empty=false; break; }
      if(empty) try{ Directory.Delete(baseDir); }catch{}
     }
    }catch{}
    if(!silent) MessageBox.Show("Ярлыки и запись удаления удалены.\nПапка "+installDir+" будет удалена после закрытия. Можете удалить её вручную.", "Ywon Companion", MessageBoxButtons.OK, MessageBoxIcon.Information);
    try{
     string bat=Path.Combine(Path.GetTempPath(),"Ywon_uninstall_"+Guid.NewGuid().ToString("N")+".cmd");
     File.WriteAllText(bat,"@echo off\r\nping 127.0.0.1 -n 3 >nul\r\nrmdir /s /q \""+installDir+"\"\r\ndel \"%~f0\"\r\n");
     System.Diagnostics.Process.Start(new System.Diagnostics.ProcessStartInfo(bat){WindowStyle=System.Diagnostics.ProcessWindowStyle.Hidden, UseShellExecute=true});
    }catch{}
    return 0;
   }catch(Exception ex){
    MessageBox.Show("Uninstall failed:\n"+ex.Message,"Ywon Companion",MessageBoxButtons.OK,MessageBoxIcon.Error);
    return 2;
   }
  }
 }
}
