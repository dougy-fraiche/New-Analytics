import {
  Axis_default,
  Chart_default,
  Component_default,
  Component_default2,
  Model_default,
  PRIORITY,
  SeriesData_default,
  Series_default,
  brushSingle,
  color_exports,
  connect,
  dataTool,
  dependencies,
  disConnect,
  disconnect,
  dispose,
  env_default,
  extendChartView,
  extendComponentModel,
  extendComponentView,
  extendSeriesModel,
  format_exports,
  getCoordinateSystemDimensions,
  getInstanceByDom,
  getInstanceById,
  getMap,
  graphic_exports2 as graphic_exports,
  helper_exports,
  init,
  init_core,
  init_echarts,
  init_extension,
  init_install,
  init_installCanvasRenderer,
  init_installLabelLayout,
  install,
  install2,
  installLabelLayout,
  matrix_exports,
  number_exports,
  parseGeoJSON,
  registerAction,
  registerCoordinateSystem,
  registerCustomSeries,
  registerLayout,
  registerLoading,
  registerLocale,
  registerMap,
  registerPostInit,
  registerPostUpdate,
  registerPreprocessor,
  registerProcessor,
  registerTheme,
  registerTransform,
  registerUpdateLifecycle,
  registerVisual,
  setCanvasCreator,
  setPlatformAPI,
  throttle,
  time_exports,
  use,
  util_exports,
  util_exports2,
  vector_exports,
  version,
  zrender_exports
} from "./chunk-NPPFGTMS.js";
import {
  __esm,
  __export
} from "./chunk-LK32TJAX.js";

// node_modules/echarts/lib/echarts.js
var echarts_exports = {};
__export(echarts_exports, {
  Axis: () => Axis_default,
  ChartView: () => Chart_default,
  ComponentModel: () => Component_default,
  ComponentView: () => Component_default2,
  List: () => SeriesData_default,
  Model: () => Model_default,
  PRIORITY: () => PRIORITY,
  SeriesModel: () => Series_default,
  color: () => color_exports,
  connect: () => connect,
  dataTool: () => dataTool,
  default: () => echarts_default,
  dependencies: () => dependencies,
  disConnect: () => disConnect,
  disconnect: () => disconnect,
  dispose: () => dispose,
  env: () => env_default,
  extendChartView: () => extendChartView,
  extendComponentModel: () => extendComponentModel,
  extendComponentView: () => extendComponentView,
  extendSeriesModel: () => extendSeriesModel,
  format: () => format_exports,
  getCoordinateSystemDimensions: () => getCoordinateSystemDimensions,
  getInstanceByDom: () => getInstanceByDom,
  getInstanceById: () => getInstanceById,
  getMap: () => getMap,
  graphic: () => graphic_exports,
  helper: () => helper_exports,
  init: () => init,
  innerDrawElementOnCanvas: () => brushSingle,
  matrix: () => matrix_exports,
  number: () => number_exports,
  parseGeoJSON: () => parseGeoJSON,
  parseGeoJson: () => parseGeoJSON,
  registerAction: () => registerAction,
  registerCoordinateSystem: () => registerCoordinateSystem,
  registerCustomSeries: () => registerCustomSeries,
  registerLayout: () => registerLayout,
  registerLoading: () => registerLoading,
  registerLocale: () => registerLocale,
  registerMap: () => registerMap,
  registerPostInit: () => registerPostInit,
  registerPostUpdate: () => registerPostUpdate,
  registerPreprocessor: () => registerPreprocessor,
  registerProcessor: () => registerProcessor,
  registerTheme: () => registerTheme,
  registerTransform: () => registerTransform,
  registerUpdateLifecycle: () => registerUpdateLifecycle,
  registerVisual: () => registerVisual,
  setCanvasCreator: () => setCanvasCreator,
  setPlatformAPI: () => setPlatformAPI,
  throttle: () => throttle,
  time: () => time_exports,
  use: () => use,
  util: () => util_exports2,
  vector: () => vector_exports,
  version: () => version,
  zrUtil: () => util_exports,
  zrender: () => zrender_exports
});
var echarts_default;
var init_echarts2 = __esm({
  "node_modules/echarts/lib/echarts.js"() {
    init_core();
    init_extension();
    init_echarts();
    init_installCanvasRenderer();
    init_install();
    init_installLabelLayout();
    use([install, install2]);
    echarts_default = {
      init: function() {
        if (true) {
          console.error(`"import echarts from 'echarts/lib/echarts.js'" is not supported anymore. Use "import * as echarts from 'echarts/lib/echarts.js'" instead;`);
        }
        return init.apply(null, arguments);
      }
    };
    use(installLabelLayout);
  }
});

export {
  echarts_exports,
  init_echarts2 as init_echarts
};
//# sourceMappingURL=chunk-O3S72YLQ.js.map
