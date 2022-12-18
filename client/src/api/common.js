import axios from "axios"

class CommonApi {
  constructor() {
    this.api = axios.create({
      baseURL: "/api/user",
    });
  }
  getJson(props) {
    return this.api.get("/jsonData", {
      params: { ...props }
    })
  }

  createItem({ key, laval, language, data }) {
    return this.api.post("/create-item", {
      body: { laval, language, data },
      params: { key }
    })
  }

  getByCardNumber({ language, laval, cardNumber }) {
    return this.api.get("/by-card-number", {
      params: {
        language, laval, cardNumber
      }
    })
  }

  translate({values, language, laval}){
    return this.api.put("/translate", {
      body:{
        language,
        laval,
        values
      }
    }) 
  }

  edit({laval, language, values, originCardNumber}){
    return this.api.put("/edit",{
      body:{
        language,
        laval,
        values,
        originCardNumber
      }
    })
  }
}

export const commonApi = new CommonApi();