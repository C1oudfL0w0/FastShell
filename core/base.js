'use strict';

const fs = require('fs');
const LANG = require('../language'); // 插件语言库
const LANG_T = antSword['language']['toastr']; // 通用通知提示

class Base {
  /**
   * 初始化
   * @param  {Object} cell dhtmlx.cell对象
   * @param  {Object} top  顶层对象
   * @return {Object}      this
   */
  constructor(cell, top) {
    var self = this;
    this.cell = cell;
    this.top = top;
  }
}
module.exports = Base;