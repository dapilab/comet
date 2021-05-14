import agent from "superagent";

export default class Request {
  /**
   * @params
   *  - method {String} Get, Post, Delete, Patch
   *  - url {String}
   *  - opt {Object} {data: {}, query: {}, successStatus: Number, type: form | json}
   * @return
   *  - {Promise} the body of the http response
   */
  request(method, url, opt) {
    return new Promise((resolve, reject) => {
      const urlPrefix = (process.env.NODE_ENV === "development" && "http://localhost:3000") || "";
      this.baseAgent(method, urlPrefix + url, opt).end((err, res) => {
        if (err || res.statusCode >= 400 || (opt && opt.successStatus && res.statusCode !== opt.successStatus)) {
          return reject(res || err);
        }
        resolve(res.body);
      });
    });
  }

  baseAgent(method, url, opt) {
    const reqHeader = { Accept: "application/json", ...(opt && opt.headers) };
    const myAgent = agent(method, url).set(reqHeader);

    if (opt && opt.data) {
      const type = (opt && opt.type) || "json";
      myAgent
        .type(type)
        .send(opt.data);
    }
    if (opt && opt.query) {
      myAgent
        .query(opt.query);
    }
    return myAgent;
  }

  create(data) {
    return this.request("POST", `${this.api}`, { data });
  }

  findAll() {
    return this.request("GET", `${this.api}`);
  }

  findById(id) {
    return this.request("GET", `${this.api}/${id}`);
  }

  updateById(id, data) {
    return this.request("PATCH", `${this.api}/${id}`, { data });
  }

  removeById(id) {
    return this.request("DELETE", `${this.api}/${id}`);
  }
}
