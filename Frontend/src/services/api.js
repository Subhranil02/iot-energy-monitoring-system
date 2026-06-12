import axios from "axios";

const API = axios.create({
  baseURL: "https://iot-energy-monitoring-systems.onrender.com",
});

export default API;