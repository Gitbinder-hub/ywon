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
   Text="Ywon Companion 0.0.6";
   Width=560; Height=430; FormBorderStyle=FormBorderStyle.FixedDialog; MaximizeBox=false; MinimizeBox=false; StartPosition=FormStartPosition.CenterScreen;
   var lbl1=new Label(){Text="Установка Ywon Companion — локальный пилот Windows.\nНеподписанный EXE: SmartScreen покажет предупреждение — это ожидаемо.", AutoSize=false, Width=520, Height=50, Left=16, Top=12};
   var lblWarn=new Label(){Text="REVIEW-пилот, не публичный релиз. Node.js 24 для запуска; Python только для опционального ASR.", AutoSize=false, Width=520, Height=26, Left=16, Top=58, ForeColor=System.Drawing.Color.DarkRed};
   var lblDir=new Label(){Text="Папка установки (per-user, без админа):", Left=16, Top=100, Width=300};
   tbDir=new TextBox(){Left=16, Width=460, Top=118, Text=Program.DefaultDir()};
   var btnBrowse=new Button(){Text="...", Left=482, Top=117, Width=54};
   btnBrowse.Click+=(s,e)=>{
    var dlg=new FolderBrowserDialog(){Description="Выберите папку", SelectedPath=tbDir.Text};
    if(dlg.ShowDialog()==DialogResult.OK) tbDir.Text=Path.Combine(dlg.SelectedPath,"Ywon Companion");
   };
   cbDesktop=new CheckBox(){Text="Ярлык на рабочем столе (вкл по умолчанию)", Left=16, Top=150, Width=500, Checked=true};
   cbAutostart=new CheckBox(){Text="Автозапуск при входе (выкл по умолчанию)", Left=16, Top=174, Width=500, Checked=false};
   var lblInfo=new Label(){Text="Создаст ярлык в Пуск/Ywon и запись удаления.\nПосле установки SETUP-ASR.cmd отдельно для русской речи.", AutoSize=false, Width=520, Height=40, Left=16, Top=204};
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
