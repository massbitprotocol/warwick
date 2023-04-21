import { Injectable } from '@nestjs/common';
import Handlebars from 'handlebars';
const jwt = require('jsonwebtoken');
require("handlebars-helpers")({
  handlebars: Handlebars
});

@Injectable()
export class TemplateService {
  constructor() {
    Handlebars.registerHelper("build_jwt", (secretKey, audience) => {
      const jwtToken = jwt.sign({}, secretKey, {
        issuer: "warwick",
        audience,
        expiresIn: "60000" // 60 seconds
      });
      return jwtToken;
    })
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
