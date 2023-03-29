import { Injectable } from '@nestjs/common';
import Handlebars from 'handlebars';
import { default as GATEWAY_RULES } from "../templates/gateway-rules";
require("handlebars-helpers")({
  handlebars: Handlebars
});

@Injectable()
export class TemplateService {
  constructor() {
    const rules = { ...GATEWAY_RULES }
    Object.keys(rules).forEach((key) => Handlebars.registerPartial(key, rules[key]))
    Handlebars.registerHelper("join", function (array, sep, options) {
      return array.map(function (item) {
        return options.fn(item);
      }).join(sep);
    });
  }

  bindTemplate(template: string, context: any) {
    const handleBar = Handlebars.compile(template);
    return handleBar(context);
  }

}
