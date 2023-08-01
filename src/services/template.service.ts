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
      const jwtToken = jwt.sign({}, Buffer.from(secretKey, "base64"), {
        expiresIn: 60 * 5, // 60 seconds
        header: {
          typ: "JWT",
          alg: "HS256"
        }
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
