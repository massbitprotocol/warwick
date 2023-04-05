import { Injectable } from '@nestjs/common';
import Handlebars from 'handlebars';
require("handlebars-helpers")({
  handlebars: Handlebars
});

@Injectable()
export class TemplateService {
  constructor() {
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
