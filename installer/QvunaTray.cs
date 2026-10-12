using System;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Net;
using System.Reflection;
using System.Text.RegularExpressions;
using System.Windows.Forms;
using Microsoft.Win32;
using System.Runtime.InteropServices;
namespace YwonTray {
 static class Program {
  static string dir = "";
  static string target = "";
  static Process server = null;
  static string url = null;
  [DllImport("kernel32.dll")] static extern bool AllocConsole();
  [DllImport("kernel32.dll")] static extern bool AttachConsole(int pid);
  static NotifyIcon tray = null;
  static bool minimized = false;
  // Single factory window
  static Form factoryForm = null;
  static Control factoryView = null;
  static string factoryUrl = null;
  static string factoryLastUrl = null;
  static bool factoryWindowOpening = false;
  static readonly object factoryLock = new object();
  // Companion not auto-opened anymore — only via tray menu
  static Form webForm = null;
  static Control webViewCtrl = null;
  static Process factoryServer = null;
  static System.Threading.Mutex singleMutex = null;
  // Polling
  static Timer factoryHttpPoll = null;
  static int factoryHttpAttempts = 0;
  public static string DefaultDir(){
   return Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),"Ywon","Ywon Companion");
  }
  static void RunSetupAsr(){
   try{
    string cmd = Path.Combine(dir, "SETUP-ASR.cmd");
    if(!File.Exists(cmd)){ MessageBox.Show("SETUP-ASR.cmd not found in "+dir,"Ywon Companion",MessageBoxButtons.OK,MessageBoxIcon.Warning); return; }
    ProcessStartInfo psi = new ProcessStartInfo();
    psi.FileName = "cmd.exe";
    psi.Arguments = "/c start \"\" \""+cmd+"\"";
    psi.WorkingDirectory = dir;
    psi.UseShellExecute = true;
    Process.Start(psi);
   }catch(Exception ex){ MessageBox.Show("Setup ASR failed:\n"+ex.Message,"Ywon Companion",MessageBoxButtons.OK,MessageBoxIcon.Error); }
  }
  static int DoCheck(){
   try{
    string d = DefaultDir();
    bool dirOk = Directory.Exists(d);
    string YwonCmd = Path.Combine(d, "Ywon.cmd");
    string startCmd = Path.Combine(d, "START.cmd");
    string factoryCmd = Path.Combine(d, "FACTORY.cmd");
    string uninstallExe = Path.Combine(d, "uninstall.exe");
    string startMenu = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.Programs),"Ywon");
    string desktop = Environment.GetFolderPath(Environment.SpecialFolder.DesktopDirectory);
    string msg = "Ywon Companion check:\n";
    msg += (dirOk?"OK":"MISS")+" installDir: "+d+"\n";
    msg += (File.Exists(YwonCmd)?"OK":"MISS")+" Ywon.cmd: "+YwonCmd+"\n";
    msg += (File.Exists(startCmd)?"OK":"MISS")+" START.cmd: "+startCmd+"\n";
    msg += (File.Exists(factoryCmd)?"OK":"MISS")+" FACTORY.cmd: "+factoryCmd+"\n";
    msg += (File.Exists(uninstallExe)?"OK":"MISS")+" uninstall.exe: "+uninstallExe+"\n";
    msg += (File.Exists(Path.Combine(startMenu,"Ywon.lnk"))?"OK":"MISS")+" Start/Ywon.lnk\n";
    msg += (File.Exists(Path.Combine(desktop,"Ywon Companion.lnk"))?"OK":"MISS")+" Desktop lnk\n";
    try{ using(var k=Registry.CurrentUser.OpenSubKey(@"Software\Microsoft\Windows\CurrentVersion\Uninstall\YwonCompanion")){ if(k!=null){ var v=k.GetValue("DisplayName"); msg+="OK HKCU Uninstall DisplayName: "+v+"\n"; } else msg+="MISS HKCU Uninstall\\YwonCompanion\n"; } }catch(Exception ex){ msg+="ERR Uninstall key: "+ex.Message+"\n"; }
    try{ using(var k=Registry.CurrentUser.OpenSubKey(@"Software\Microsoft\Windows\CurrentVersion\Run")){ if(k!=null){ var v=k.GetValue("YwonCompanion"); if(v!=null) msg+="OK HKCU Run YwonCompanion: "+v+"\n"; else msg+="(absent) HKCU Run YwonCompanion - OFF by default\n"; } } }catch(Exception ex){ msg+="ERR Run key: "+ex.Message+"\n"; }
    if(factoryUrl!=null) msg+="Factory URL: "+factoryUrl+"\n"; else if(url!=null) msg+="Companion URL: "+url+"\n"; else msg+="URL: (server not yet ready)\n";
    try{
     string portableNode = @"E:\Ywoom-ASR\node-portable\node.exe";
     string localNode = Path.Combine(dir, "node-portable", "node.exe");
     if(File.Exists(portableNode)) msg+="OK portable Node: "+portableNode+"\n";
     else if(File.Exists(localNode)) msg+="OK local Node: "+localNode+"\n";
     else msg+="(info) portable Node not yet installed - will use system Node 24\n";
     string model = @"E:\Ywoom-ASR\vosk-model-small-ru-0.22\am\final.mdl";
     if(File.Exists(model)) msg+="OK Vosk model: vosk-model-small-ru-0.22\n";
     else msg+="(info) Vosk model not yet installed - run SETUP-ASR.cmd\n";
     bool wv2dll = File.Exists(Path.Combine(dir, "Microsoft.Web.WebView2.WinForms.dll"));
     bool loader = File.Exists(Path.Combine(dir, "WebView2Loader.dll"));
     msg+=(wv2dll?"OK":"MISS")+" WebView2 WinForms: "+(wv2dll?"found":"MISSING")+"\n";
     msg+=(loader?"OK":"MISS")+" WebView2Loader: "+(loader?"found":"MISSING - will hang")+"\n";
     if(wv2dll && loader){
      try{
       var b1=File.ReadAllBytes(Path.Combine(dir,"QvunaTray.exe"));
       var b2=File.ReadAllBytes(Path.Combine(dir,"WebView2Loader.dll"));
       int pe1=BitConverter.ToInt32(b1,0x3C); int m1=BitConverter.ToUInt16(b1,pe1+4);
       int pe2=BitConverter.ToInt32(b2,0x3C); int m2=BitConverter.ToUInt16(b2,pe2+4);
       string a1=m1==0x8664?"x64":m1==0x14C?"x86":"other";
       string a2=m2==0x8664?"x64":m2==0x14C?"x86":"other";
       msg+="Arch QvunaTray:"+a1+" Loader:"+a2+(a1!=a2?" MISMATCH!":" OK")+"\n";
      }catch{}
     }
    }catch{}
    // Test factory reachability
    try{
     var req=(HttpWebRequest)WebRequest.Create("http://127.0.0.1:3000/");
     req.Timeout=2000;
     using(var resp=(HttpWebResponse)req.GetResponse()){
      msg+="Factory HTTP "+(int)resp.StatusCode+" OK\n";
     }
    }catch(Exception ex){ msg+="Factory HTTP not ready: "+ex.Message.Substring(0,Math.Min(80,ex.Message.Length))+"\n"; }
    try{ Console.WriteLine(msg); Console.Out.Flush(); }catch{}
    if(Environment.UserInteractive){
     try{ if(!Console.IsOutputRedirected) MessageBox.Show(msg,"Ywon Companion",MessageBoxButtons.OK,MessageBoxIcon.Information); }catch{}
    }
    return dirOk?0:2;
   }catch(Exception ex){ try{ Console.Error.WriteLine(ex.ToString()); }catch{} MessageBox.Show(ex.ToString(),"Ywon check",MessageBoxButtons.OK,MessageBoxIcon.Error); return 2; }
  }
  static Process StartNodeServer(string tgt, string workingDir, Action<string> onLine){
   try{
    string file = tgt; string args = "";
    if(tgt.EndsWith(".cmd", StringComparison.OrdinalIgnoreCase)){ file="cmd.exe"; args="/c \"\"" + tgt + "\"\""; }
    ProcessStartInfo psi = new ProcessStartInfo();
    psi.FileName=file; psi.Arguments=args; psi.WorkingDirectory=workingDir;
    psi.UseShellExecute=false; psi.CreateNoWindow=true; psi.RedirectStandardOutput=true; psi.RedirectStandardError=true; psi.WindowStyle=ProcessWindowStyle.Hidden;
    Process p = Process.Start(psi);
    if(p!=null){
     p.OutputDataReceived += (s,e)=>{ if(e.Data!=null) try{onLine(e.Data);}catch{} };
     p.ErrorDataReceived += (s,e)=>{ if(e.Data!=null) try{onLine(e.Data);}catch{} };
     p.BeginOutputReadLine(); p.BeginErrorReadLine();
    }
    return p;
   }catch(Exception ex){ MessageBox.Show("Не удалось запустить сервер:\n"+ex.Message+" target="+tgt, "Ywon",MessageBoxButtons.OK,MessageBoxIcon.Error); return null; }
  }
  static void StartServer(){
   StartCompanion();
   StartFactory();
  }
  static void StartCompanion(){
   try{ server = StartNodeServer(target, dir, OnOutput); }catch{}
  }
  static void OnFactoryOutput(string data){
   if(String.IsNullOrEmpty(data)) return;
   try{
    var m = Regex.Match(data, @"http://127\.0\.0\.1:\d+");
    if(m.Success){
     string u=m.Value; if(u==factoryUrl) return; factoryUrl=u;
     // Do NOT auto-open window from background thread directly — schedule on UI thread and let HTTP poll decide
     // Just record URL; HTTP poll will open when server is actually reachable
     Debug.WriteLine("Factory URL: "+u);
    }
   }catch{}
  }
  static void StartFactory(){
   try{
    string f = Path.Combine(dir, "FACTORY.cmd");
    if(!File.Exists(f)){
     MessageBox.Show("FACTORY.cmd не найден в "+dir+"\nПереустанови Ywon Companion.", "Ywon",MessageBoxButtons.OK,MessageBoxIcon.Error);
     return;
    }
    factoryServer = StartNodeServer(f, dir, OnFactoryOutput);
   }catch(Exception ex){ MessageBox.Show("StartFactory fail: "+ex.Message,"Ywon",MessageBoxButtons.OK,MessageBoxIcon.Error); }
  }
  static void OnOutput(string data){
   if(String.IsNullOrEmpty(data)) return;
   try{
    var m = Regex.Match(data, @"http://127\.0\.0\.1:\d+");
    if(m.Success){
     string newUrl = m.Value;
     if(newUrl==url) return;
     url = newUrl;
     // Companion window NOT auto-opened — user requested factory only. Record URL for tray menu.
    }
   }catch{}
  }
  // Single unified factory window — no duplicate windows
  static void TryOpenFactoryWindow(){
   lock(factoryLock){
    if(factoryWindowOpening) return;
    if(factoryForm!=null && !factoryForm.IsDisposed) {
     try{ factoryForm.Invoke(new Action(()=>{ factoryForm.WindowState=FormWindowState.Normal; factoryForm.Show(); factoryForm.BringToFront(); factoryForm.Activate(); })); }catch{}
     return;
    }
    factoryWindowOpening=true;
   }
   // Must be on UI thread
   if(tray!=null && Application.OpenForms.Count==0){
    // No form to marshal — create directly on UI thread (we ARE on UI thread when called from timer)
    ShowFactoryWindowInternal();
   } else {
    try{
     Form marshal=null; try{ if(Application.OpenForms.Count>0) marshal=Application.OpenForms[0]; }catch{}
     if(marshal!=null && marshal.InvokeRequired) marshal.BeginInvoke(new Action(()=> ShowFactoryWindowInternal()));
     else ShowFactoryWindowInternal();
    }catch{ ShowFactoryWindowInternal(); }
   }
  }
  static void ShowFactoryWindowInternal(){
   string u = factoryUrl ?? "http://127.0.0.1:3000";
   ShowFactoryWindow(u);
   lock(factoryLock){ factoryWindowOpening=false; }
  }
  static void ShowFactoryWindow(string u){
   try{
    lock(factoryLock){
     if(factoryForm!=null && !factoryForm.IsDisposed){ try{ factoryForm.WindowState=FormWindowState.Normal; factoryForm.Show(); factoryForm.BringToFront(); factoryForm.Activate(); }catch{} return; }
     if(factoryWindowOpening && factoryForm!=null) return;
    }
    Form f = new Form(); f.Text="Ywoom — Завод / Студия / Подписки"; f.Width=1240; f.Height=820; f.StartPosition=FormStartPosition.CenterScreen; f.Icon=SystemIcons.Application;
    // Loading overlay — immediately visible, proves window is alive
    Label loading = new Label(); loading.Text = "Запускаю Ywoom Завод...\n"+u+"\nЖду ответа сервера..."; loading.Dock=DockStyle.Fill; loading.TextAlign=ContentAlignment.MiddleCenter; loading.Font=new Font("Segoe UI",12); loading.BackColor=Color.FromArgb(15,20,30); loading.ForeColor=Color.FromArgb(168,179,199);
    f.Controls.Add(loading);
    factoryForm=f; factoryLastUrl=u;
    f.FormClosed+=(s,e)=>{ factoryForm=null; factoryView=null; factoryWindowOpening=false; };
    StatusStrip st = new StatusStrip(); ToolStripStatusLabel lb=new ToolStripStatusLabel(); lb.Text="Загрузка • "+u; lb.Spring=true; st.Items.Add(lb);
    ToolStripStatusLabel btnOpen=new ToolStripStatusLabel("Открыть в браузере"); btnOpen.IsLink=true; btnOpen.Click+=(s2,e2)=>{ try{ Process.Start(new ProcessStartInfo(u){UseShellExecute=true}); }catch{} }; st.Items.Add(btnOpen); f.Controls.Add(st);
    f.Show(); f.BringToFront(); f.Activate(); Application.DoEvents();
    // Defer WebView2 creation to next message loop — keeps window responsive
    Timer initTimer=new Timer(); initTimer.Interval=100; initTimer.Tick+=(s,e)=>{
     initTimer.Stop(); initTimer.Dispose();
     try{ InitWebView2(f, u, loading, lb); }catch(Exception ex){ ShowFactoryFallback(f, u, "initTimer: "+ex.Message, loading, st, lb); }
    }; initTimer.Start();
    f.Update();
   }catch(Exception ex){ try{ MessageBox.Show("Factory window error:\n"+ex.ToString(), "Ywoom",MessageBoxButtons.OK,MessageBoxIcon.Error); }catch{} lock(factoryLock){ factoryWindowOpening=false; } }
  }
  static void InitWebView2(Form f, string u, Label loading, ToolStripStatusLabel lb){
   Control view=null; string lastErr="";
   try{
    Assembly asm=null;
    string[] probes=new string[]{ Path.Combine(dir,"Microsoft.Web.WebView2.WinForms.dll"), Path.Combine(Path.GetDirectoryName(Assembly.GetExecutingAssembly().Location)??dir,"Microsoft.Web.WebView2.WinForms.dll") };
    foreach(var p2 in probes){ if(File.Exists(p2)){ try{ asm=Assembly.LoadFrom(p2); break; }catch(Exception ex){ lastErr=ex.Message; } } }
    if(asm==null){ try{ asm=Assembly.Load("Microsoft.Web.WebView2.WinForms"); }catch(Exception ex){ lastErr=ex.Message; } }
    if(asm!=null){
     Type t2=asm.GetType("Microsoft.Web.WebView2.WinForms.WebView2");
     if(t2!=null){
      view=(Control)Activator.CreateInstance(t2); view.Dock=DockStyle.Fill;
      f.Controls.Add(view); view.BringToFront();
      // Ensure view is created — needed for WebView2
      try{ view.CreateControl(); }catch{}
      // Hook navigation events for loading feedback
      try{
       var navCompleted = t2.GetEvent("NavigationCompleted");
       if(navCompleted!=null){
        var handler = new EventHandler((s2,e2)=>{
         try{ loading.Visible=false; lb.Text="WebView2 • "+u; factoryView=view; }catch{}
        });
        // Use reflection to add handler — need delegate matching EventHandler
        // WebView2 NavigationCompleted is EventHandler<CoreWebView2NavigationCompletedEventArgs> — use dynamic
        try{
         var addMethod = navCompleted.GetAddMethod();
         // Create delegate via reflection
         var paramType = navCompleted.EventHandlerType;
         var del = Delegate.CreateDelegate(paramType, handler.Target, handler.Method);
         addMethod.Invoke(view, new object[]{ del });
        }catch{}
       }
      }catch{}
      // Navigate — WebView2 auto-inits CoreWebView2
      try{
       var sp=t2.GetProperty("Source");
       if(sp!=null){ sp.SetValue(view,new Uri(u),null); lb.Text="WebView2 • "+u; }
       else { lastErr+=" no Source prop"; throw new Exception(lastErr); }
       // Hide loading after short delay — if navigation hangs, fallback will trigger
       Timer fallback=new Timer(); fallback.Interval=8000; fallback.Tick+=(s2,e2)=>{
        fallback.Stop(); fallback.Dispose();
        if(loading.Visible){
         // Still loading after 8s — check if server reachable
         try{
          var req=(HttpWebRequest)WebRequest.Create(u);
          req.Timeout=3000;
          using(var resp=(HttpWebResponse)req.GetResponse()){
           // Server OK but WebView2 hung — offer fallback
           loading.Text="Сервер отвечает, но WebView2 не загрузил страницу.\nПопробуй открыть в браузере.\nURL: "+u;
           lb.Text="WebView2 завис • "+u;
          }
         }catch(Exception ex){
          loading.Text="Сервер не отвечает: "+ex.Message+"\nURL: "+u+"\nПопробуй открыть в браузере.";
          lb.Text="Сервер недоступен • "+u;
         }
        }
       }; fallback.Start();
       Timer hideLoading=new Timer(); hideLoading.Interval=2500; hideLoading.Tick+=(s2,e2)=>{
        hideLoading.Stop(); hideLoading.Dispose();
        try{ if(!loading.IsDisposed && view!=null && !view.IsDisposed){ loading.Visible=false; if(factoryView==null) factoryView=view; } }catch{}
       }; hideLoading.Start();
      }catch(Exception ex){ lastErr+=" Source: "+ex.Message; ShowFactoryFallback(f, u, lastErr, loading, lb); return; }
     } else { lastErr+=" WebView2 type not found"; ShowFactoryFallback(f, u, lastErr, loading, lb); return; }
    } else { lastErr+=" WebView2 assembly not found"; ShowFactoryFallback(f, u, lastErr, loading, lb); return; }
   }catch(Exception ex){ lastErr=ex.Message; ShowFactoryFallback(f, u, lastErr, loading, lb); return; }
  }
  static void ShowFactoryFallback(Form f, string u, string lastErr, Label loading, ToolStripStatusLabel lb){
   try{
    if(!loading.IsDisposed){
     loading.Text="WebView2 не удалось запустить.\n\nОшибка: "+lastErr.Trim()+"\nDLLs: "+(File.Exists(Path.Combine(dir,"Microsoft.Web.WebView2.WinForms.dll"))?"found":"MISS")+" / "+(File.Exists(Path.Combine(dir,"WebView2Loader.dll"))?"loader found":"loader MISS")+"\nURL: "+u+"\nНажми кнопку ниже.";
     loading.Font=new Font("Consolas",9);
    }
    // Add browser button if not exists
    bool hasBtn=false; foreach(Control c in f.Controls) if(c is Button) hasBtn=true;
    if(!hasBtn){
     Button btnOpen2=new Button(); btnOpen2.Text="Открыть в браузере → "+u; btnOpen2.Dock=DockStyle.Bottom; btnOpen2.Height=36;
     btnOpen2.Click+=(s2,e2)=>{ try{ Process.Start(new ProcessStartInfo(u){UseShellExecute=true}); }catch{} };
     f.Controls.Add(btnOpen2); btnOpen2.BringToFront();
    }
    if(lb!=null) lb.Text="ОШИБКА WebView2 • "+lastErr.Trim().Substring(0,Math.Min(60,lastErr.Trim().Length));
   }catch{}
  }
  static void ShowFactoryFallback(Form f, string u, string lastErr, Label loading, StatusStrip st, ToolStripStatusLabel lb){
   ShowFactoryFallback(f, u, lastErr, loading, lb);
  }
  static void ShowWebWindow(string u){
   try{
    if(webForm!=null && !webForm.IsDisposed){ try{ webForm.WindowState=FormWindowState.Normal; webForm.Show(); webForm.BringToFront(); webForm.Activate(); }catch{} return; }
    Form f = new Form(); f.Text = "Ywon — локальный пилот"; f.Width = 1120; f.Height = 760; f.StartPosition=FormStartPosition.CenterScreen; f.Icon=SystemIcons.Application;
    Label loading2=new Label(); loading2.Text="Загружаю Помощник...\n"+u; loading2.Dock=DockStyle.Fill; loading2.TextAlign=ContentAlignment.MiddleCenter; loading2.Font=new Font("Segoe UI",12); loading2.BackColor=Color.FromArgb(15,20,30); loading2.ForeColor=Color.FromArgb(168,179,199); f.Controls.Add(loading2);
    StatusStrip st2=new StatusStrip(); ToolStripStatusLabel lb2=new ToolStripStatusLabel(); lb2.Text="Загрузка WebView2 • "+u; lb2.Spring=true; st2.Items.Add(lb2);
    ToolStripStatusLabel btnOpen2=new ToolStripStatusLabel("Открыть в браузере"); btnOpen2.IsLink=true; btnOpen2.Click+=(s2,e2)=>{ try{ Process.Start(new ProcessStartInfo(u){UseShellExecute=true}); }catch{} }; st2.Items.Add(btnOpen2); f.Controls.Add(st2);
    webForm=f;
    f.FormClosed+=(s,e)=>{ webForm=null; webViewCtrl=null; };
    f.Show(); f.BringToFront(); f.Activate(); Application.DoEvents();
    Control view=null; string lastErr="";
    try{
     Assembly asm=null;
     string[] probes=new string[]{ Path.Combine(dir,"Microsoft.Web.WebView2.WinForms.dll"), Path.Combine(Path.GetDirectoryName(Assembly.GetExecutingAssembly().Location)??dir,"Microsoft.Web.WebView2.WinForms.dll") };
     foreach(var p2 in probes){ if(File.Exists(p2)){ try{ asm=Assembly.LoadFrom(p2); break; }catch(Exception ex){ lastErr=ex.Message; } } }
     if(asm==null){ try{ asm=Assembly.Load("Microsoft.Web.WebView2.WinForms"); }catch(Exception ex){ lastErr=ex.Message; } }
     if(asm!=null){ Type t2=asm.GetType("Microsoft.Web.WebView2.WinForms.WebView2"); if(t2!=null){ view=(Control)Activator.CreateInstance(t2); view.Dock=DockStyle.Fill; f.Controls.Add(view); view.BringToFront(); view.CreateControl();
       try{ var sp=t2.GetProperty("Source"); if(sp!=null){ sp.SetValue(view,new Uri(u),null); lb2.Text="WebView2 • "+u; } }catch(Exception ex){ lastErr+=" Source:"+ex.Message; }
       Timer hl=new Timer(); hl.Interval=2500; hl.Tick+=(s2,e2)=>{ hl.Stop(); hl.Dispose(); try{ loading2.Visible=false; if(webViewCtrl==null) webViewCtrl=view; }catch{} }; hl.Start();
     } }
    }catch(Exception ex){ lastErr=ex.Message; }
    if(view==null){
     loading2.Text="WebView2 не стартанул: "+lastErr.Trim()+"\nURL: "+u; loading2.Font=new Font("Consolas",9);
     Button b=new Button(); b.Text="Открыть в браузере → "+u; b.Dock=DockStyle.Bottom; b.Height=36; b.Click+=(s2,e2)=>{ try{ Process.Start(new ProcessStartInfo(u){UseShellExecute=true}); }catch{} }; f.Controls.Add(b); b.BringToFront();
     lb2.Text="ОШИБКА WebView2 • "+lastErr.Substring(0,Math.Min(60,lastErr.Length));
    } else if(webViewCtrl==null) webViewCtrl=view;
   }catch(Exception ex){ try{ MessageBox.Show("WebView error:\n"+ex.Message+"\nURL: "+u+"\n", "Ywon",MessageBoxButtons.OK,MessageBoxIcon.Warning); }catch{} }
  }
  static void NavigateWebWindow(string u){
   try{
    if(webForm==null || webForm.IsDisposed){ ShowWebWindow(u); return; }
    if(webViewCtrl==null){ ShowWebWindow(u); return; }
    try{ if(webForm.WindowState==FormWindowState.Minimized) webForm.WindowState=FormWindowState.Normal; webForm.Show(); webForm.BringToFront(); webForm.Activate(); }catch{}
    Type t2 = webViewCtrl.GetType(); var src = t2.GetProperty("Source");
    if(src!=null && src.CanWrite){ try{ src.SetValue(webViewCtrl, new Uri(u), null); return; }catch{} }
    if(webViewCtrl is WebBrowser){ try{ ((WebBrowser)webViewCtrl).Navigate(u); return; }catch{} }
    try{ var cp = t2.GetProperty("CoreWebView2"); if(cp!=null){ var core=cp.GetValue(webViewCtrl,null); if(core!=null){ var nv=core.GetType().GetMethod("Navigate", new Type[]{ typeof(string) }); if(nv!=null){ nv.Invoke(core,new object[]{u}); return; } } } }catch{}
    ShowWebWindow(u);
   }catch(Exception ex){ try{ MessageBox.Show("Navigate failed:\n"+ex.Message, "Ywon", MessageBoxButtons.OK, MessageBoxIcon.Warning); }catch{} }
  }
  static void OpenFactoryWindow(){
   try{
    if(factoryForm!=null && !factoryForm.IsDisposed){ try{ factoryForm.WindowState=FormWindowState.Normal; factoryForm.Show(); factoryForm.BringToFront(); factoryForm.Activate(); }catch{} return; }
    string u = factoryUrl ?? "http://127.0.0.1:3000";
    ShowFactoryWindow(u);
   }catch(Exception ex){ MessageBox.Show("Не удалось открыть Завод:\n"+ex.Message, "Ywon",MessageBoxButtons.OK,MessageBoxIcon.Warning); }
  }
  static void OpenBrowser(){
   try{
    if(webForm!=null && !webForm.IsDisposed){ try{ webForm.WindowState=FormWindowState.Normal; webForm.Show(); webForm.BringToFront(); webForm.Activate(); }catch{} return; }
    if(!String.IsNullOrEmpty(url)) ShowWebWindow(url);
    else {
     string fallback = "Помощник еще не запущен. Подожди 3 сек или запусти START.cmd вручную.\nПапка: "+dir+"\nURL: "+(url??"(нет)");
     MessageBox.Show(fallback, "Ywon Companion",MessageBoxButtons.OK,MessageBoxIcon.Information);
    }
   }catch(Exception ex){ MessageBox.Show("Не удалось открыть браузер:\n"+ex.Message+"\nURL: "+(url??"(нет)"), "Ywon Companion",MessageBoxButtons.OK,MessageBoxIcon.Error); }
  }
  [STAThread]
  static int Main(string[] args){
   bool flagMinimized = false;
   bool checkOnly = false;
   bool help = false;
   foreach(var a in args){
    if(a=="--minimized") flagMinimized=true;
    else if(a=="--check") checkOnly=true;
    else if(a=="--help"||a=="-h") help=true;
   }
   minimized = flagMinimized;
   if(help||checkOnly){ try{ AllocConsole(); }catch{} try{ AttachConsole(-1); }catch{} }
   if(help){ string h="YwonTray.exe - tray for Ywon Companion\n  --minimized  start hidden, balloon on url\n  --check      verify shortcuts/registry\n  --help       this help\n  WebView2 embedded window with fallback to external browser"; try{ Console.WriteLine(h); Console.Out.Flush(); }catch{} try{ if(Environment.UserInteractive && !Console.IsOutputRedirected) MessageBox.Show(h,"Ywon Companion",MessageBoxButtons.OK,MessageBoxIcon.Information); }catch{} return 0; }
   if(checkOnly){ return DoCheck(); }
   bool created;
   try{
    singleMutex = new System.Threading.Mutex(true, "Global\\YwonCompanionSingleInstance", out created);
    if(!created){
     MessageBox.Show("Ywon уже запущен — ищи иконку в трее (возле часов). Если не видно — нажми стрелку ^ и открой его оттуда.", "Ywon Companion", MessageBoxButtons.OK, MessageBoxIcon.Information);
     return 0;
    }
   }catch{}
   dir = Path.GetDirectoryName(System.Reflection.Assembly.GetExecutingAssembly().Location) ?? "";
   string startCmd2 = Path.Combine(dir, "START.cmd");
   string YwonCmd2 = Path.Combine(dir, "Ywon.cmd");
   if(File.Exists(startCmd2)) target = startCmd2;
   else if(File.Exists(YwonCmd2)) target = YwonCmd2;
   else target = startCmd2;
   Application.EnableVisualStyles();
   Application.SetCompatibleTextRenderingDefault(false);
   tray = new NotifyIcon();
   try{
    string icoPath = Path.Combine(dir, "Ywoom.ico");
    if(File.Exists(icoPath)) tray.Icon = new Icon(icoPath);
    else tray.Icon = SystemIcons.Application;
   }catch{ tray.Icon = SystemIcons.Application; }
   tray.Text = "Ywoom — Завод";
   tray.Visible = true;
   ContextMenuStrip menu = new ContextMenuStrip();
   var itemFactory = new ToolStripMenuItem("Открыть Завод (Ywoom)");
   var itemCompanion = new ToolStripMenuItem("Открыть Помощник (аудио)");
   var itemCheck = new ToolStripMenuItem("Проверить установку");
   var itemSetup = new ToolStripMenuItem("Настройка ASR (SETUP-ASR)");
   var itemAutostart = new ToolStripMenuItem("Автозапуск: выкл");
   try{
    using(var rk=Registry.CurrentUser.OpenSubKey(@"Software\Microsoft\Windows\CurrentVersion\Run")){
     var v=rk!=null ? rk.GetValue("YwonCompanion") : null;
     itemAutostart.Text = v!=null ? "Автозапуск: вкл ✓" : "Автозапуск: выкл";
     itemAutostart.Checked = v!=null;
    }
   }catch{}
   var itemExit = new ToolStripMenuItem("Выход");
   menu.Items.Add(itemFactory);
   menu.Items.Add(itemCompanion);
   menu.Items.Add(new ToolStripSeparator());
   menu.Items.Add(itemCheck);
   menu.Items.Add(itemSetup);
   menu.Items.Add(itemAutostart);
   menu.Items.Add(new ToolStripSeparator());
   menu.Items.Add(itemExit);
   tray.ContextMenuStrip = menu;
   tray.DoubleClick += (s,e)=> OpenFactoryWindow();
   itemFactory.Click += (s,e)=>{ OpenFactoryWindow(); };
   itemCompanion.Click += (s,e)=>{ if(url!=null) ShowWebWindow(url); else OpenBrowser(); };
   itemCheck.Click += (s,e)=> DoCheck();
   itemSetup.Click += (s,e)=> RunSetupAsr();
   itemAutostart.Click += (s,e)=>{
    try{
     using(var rk=Registry.CurrentUser.CreateSubKey(@"Software\Microsoft\Windows\CurrentVersion\Run")){
      var cur=rk.GetValue("YwonCompanion");
      if(cur!=null){ rk.DeleteValue("YwonCompanion",false); itemAutostart.Text="Автозапуск: выкл"; itemAutostart.Checked=false; MessageBox.Show("Автозапуск выключен.","Ywoom",MessageBoxButtons.OK,MessageBoxIcon.Information); }
      else { string exe=Path.Combine(dir,"QvunaTray.exe"); if(!File.Exists(exe)) exe=Path.Combine(dir,"YwonTray.exe"); rk.SetValue("YwonCompanion","\""+exe+"\" --minimized"); itemAutostart.Text="Автозапуск: вкл ✓"; itemAutostart.Checked=true; MessageBox.Show("Автозапуск включён — Ywoom откроется при входе свёрнутым.","Ywoom",MessageBoxButtons.OK,MessageBoxIcon.Information); }
     }
    }catch(Exception ex){ MessageBox.Show("Не удалось переключить автозапуск:\n"+ex.Message,"Ywoom",MessageBoxButtons.OK,MessageBoxIcon.Warning); }
   };
   itemExit.Click += (s,e)=> { try{ if(factoryForm!=null && !factoryForm.IsDisposed) factoryForm.Close(); }catch{} try{ if(webForm!=null && !webForm.IsDisposed) webForm.Close(); }catch{} tray.Visible=false; try{ if(server!=null && !server.HasExited) server.Kill(); }catch{} try{ if(factoryServer!=null && !factoryServer.HasExited) factoryServer.Kill(); }catch{} try{ if(singleMutex!=null){ singleMutex.ReleaseMutex(); singleMutex.Dispose(); singleMutex=null; } }catch{} Application.Exit(); };
   tray.BalloonTipClicked += (s,e)=> OpenFactoryWindow();
   StartServer();
   // Wait for factory HTTP reachable before opening window — prevents white wheel
   factoryHttpPoll = new Timer(); factoryHttpPoll.Interval=600; factoryHttpPoll.Tick+=(s,e)=>{
    factoryHttpAttempts++;
    if(factoryHttpAttempts>30){ factoryHttpPoll.Stop(); factoryHttpPoll.Dispose(); factoryHttpPoll=null; if(!minimized) TryOpenFactoryWindow(); return; }
    try{
     var req=(HttpWebRequest)WebRequest.Create("http://127.0.0.1:3000/");
     req.Timeout=1500;
     using(var resp=(HttpWebResponse)req.GetResponse()){
      factoryHttpPoll.Stop(); factoryHttpPoll.Dispose(); factoryHttpPoll=null;
      factoryUrl="http://127.0.0.1:3000";
      if(!minimized) TryOpenFactoryWindow();
     }
    }catch{
     // Still not ready — keep polling
     if(factoryServer!=null && factoryServer.HasExited){
      factoryHttpPoll.Stop(); factoryHttpPoll.Dispose(); factoryHttpPoll=null;
      MessageBox.Show("Завод не запустился. Проверь что Node 24 установлен.\nПопробуй запустить FACTORY.cmd вручную.", "Ywon",MessageBoxButtons.OK,MessageBoxIcon.Warning);
     }
    }
   }; factoryHttpPoll.Start();
   // Backup: if HTTP polling somehow missed, try after 5s anyway
   Timer backup=new Timer(); backup.Interval=5000; backup.Tick+=(s,e)=>{ backup.Stop(); backup.Dispose(); if(factoryForm==null && !minimized) TryOpenFactoryWindow(); }; backup.Start();
   Application.Run();
   tray.Visible=false;
   try{ if(factoryHttpPoll!=null){ factoryHttpPoll.Stop(); factoryHttpPoll.Dispose(); } }catch{}
   try{ if(server!=null && !server.HasExited) server.Kill(); }catch{}
   try{ if(factoryServer!=null && !factoryServer.HasExited) factoryServer.Kill(); }catch{}
   try{ if(factoryForm!=null && !factoryForm.IsDisposed) factoryForm.Close(); }catch{}
   try{ if(webForm!=null && !webForm.IsDisposed) webForm.Close(); }catch{}
   try{ if(singleMutex!=null){ singleMutex.ReleaseMutex(); singleMutex.Dispose(); singleMutex=null; } }catch{}
   return 0;
  }
 }
}
