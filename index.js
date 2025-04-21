'use strict';

const WIN = require('ui/window');
const LANG_T = antSword['language']['toastr'];
const path = require('path');
const LANG = require('./language');

const {
  BaseInfo
} = require('./payload');

/**
 * 插件类
 */
class Plugin {
  constructor(opt) {
    let self = this;
    self.opt = opt;
    self.core = new antSword['core'][opt['type']](opt);
    self.core_menu = [
      {
        id: "fuzz_search",
        icon: "flag",
        type: "button",
        text: LANG['toolbar']['fuzz_search']
      },
      {
        id: "ini_limit",
        icon: "check",
        type: "button",
        text: LANG['toolbar']['ini_limit']
      },
      {
        id: "privilege_scan",
        icon: "check",
        type: "button",
        text: LANG['toolbar']['privilege_scan']
      },
      {
        id: "ip_ports_scan",
        icon: "wifi",
        type: "button",
        text: LANG['toolbar']['ip_ports_scan']
      },
      {
        id: 'dev_env_scan',
        icon: 'wrench',
        type: 'button',
        text: LANG['toolbar']['dev_env_scan']
      },
      {
        id: 'process_scan',
        icon: 'list',
        type: 'button',
        text: LANG['toolbar']['process_scan']
      }
    ]

    let cores = {};
    self.core_menu.map((_) => {
      cores[_.id] = require(`./core/${_.id}/index`);
    });

    self.cores = cores;

    // 右侧状态栏
    self.infodata = {
      os: "",
      arch: "",
      ver: "",
      shell_name: "",
      phpself: "",
      current_user: ""
    };

    // 创建一个 window
    self.status_check = null;
    let win = new WIN({
      title: `${LANG['title']}-${opt['ip']}`,
      height: 500,
      width: 650,
    });
    self.win = win;
    self.createToolbar();
    self.layout = win.win.attachLayout('2U');
    self.config_cell = self.createConfigCell(self.layout.cells('a'));
    self.status_cell = self.createStatusCell(self.layout.cells('b'));
    self.core_instance = null;
    self.reloadStatusCell();

    self.toolbar.attachEvent('onClick', (id) => {
      switch (id) {
        case 'start':
          self.toolbar.enableItem('start');
          try {
            self.core_instance.exploit();
          } catch (e) {
            toastr.error(JSON.stringify(e), LANG_T['error']);
          }
          break;
        default:
          if (self.cores.hasOwnProperty(id)) {
            self.core_instance = new self.cores[id](self.config_cell.cell, self);
            self.toolbar.enableItem('start');
          }
          break;
      }
    });
  }

  reloadStatusCell() {
    let self = this;
    self.core.request({
      _: BaseInfo()
    }).then((_ret) => { // 处理返回数据
      let res = _ret['text'];
      if (res.indexOf("ERROR://") > -1) {
        throw res;
      } else if (res != "") {
        res = antSword.unxss(res, false);
        self.infodata = Object.assign(self.infodata, JSON.parse(res));
        self.status_cell = self.createStatusCell(self.layout.cells('b'));
      }
    }).catch((err) => { // 处理异常数据
      toastr.error(`${LANG['error']}: ${JSON.stringify(err)}`, LANG_T['error']);
    });
  }

  createStatusCell(cell) {
    let self = this;
    cell.setWidth(220);
    cell.fixSize(1, 0);
    cell.setText(`<i class="fa fa-info"></i> ${LANG['status_cell']['title']}`);
    let form = cell.attachForm([{
      type: 'settings',
      position: 'label-left',
      labelWidth: 80,
    }, {
      type: 'block',
      inputWidth: 'auto',
      list: [{
        type: 'settings',
        blockOffset: 0,
        labelAlign: "left"
      },
      {
        type: "label",
        label: `<span>${LANG['status_cell']['ver']}</span>`
      },
      {
        type: "label",
        label: `<span>${LANG['status_cell']['arch']}</span>`
      },
      {
        type: "label",
        label: `<span>${LANG['status_cell']['os']}</span>`
      },
      {
        type: "label",
        label: `<span>${LANG['status_cell']['phpself']}</span>`
      },
      {
        type: "label",
        label: `<span>${LANG['status_cell']['shell_dir']}</span>`
      },
      {
        type: "label",
        label: `<span>${LANG['status_cell']['current_user']}</span>`
      },
      {
        type: "newcolumn"
      },
      {
        type: "label",
        name: "ver",
        label: `<span style='color: #000000;'>${antSword.noxss(self.infodata["ver"])}</span>`
      },
      {
        type: "label",
        name: "arch",
        label: `<span style='color: #000000;'>${antSword.noxss(self.infodata["arch"])}</span>`
      },
      {
        type: "label",
        name: "os",
        label: `<span style='color: #000000;'>${antSword.noxss(self.infodata["os"])}</span>`
      },
      {
        type: "label",
        name: "phpself",
        label: `<span style='color: #000000;'>${antSword.noxss(self.infodata["phpself"])}</span>`
      },
      {
        type: "label",
        name: "shell_dir",
        label: `<span style='color: #000000;'>${antSword.noxss(self.infodata["shell_dir"])}</span>`
      },
      {
        type: "label",
        name: "current_user",
        label: `<span style='color: #000000;'>${antSword.noxss(self.infodata["current_user"])}</span>`
      }
      ]
    }
    ], true);
    return {
      cell: cell,
      form: form,
    }
  }

  createToolbar() {
    let self = this;
    let toolbar = self.win.win.attachToolbar();
    toolbar.loadStruct([{
      id: 'new',
      type: 'buttonSelect',
      icon: 'plus-circle',
      openAll: true,
      text: LANG['toolbar']['select_mode'],
      options: self.core_menu,
    }, {
      id: 'start',
      type: 'button',
      text: LANG['toolbar']['start'],
      icon: 'play',
      enabled: false,
    },]);
    self.toolbar = toolbar;
  }
  createConfigCell(cell) {
    let self = this;
    cell.hideHeader();
    cell.attachHTMLString(`
    <div align="center" class="about">
      <p style="color: #795548;margin: 30% auto;">${LANG['no_mode']}</p>
    </div>
    `);
    return {
      cell: cell,
      toolbar: toolbar,
    }
  }
}

module.exports = Plugin;