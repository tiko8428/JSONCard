import { useEffect, useState } from "react";
import axios from "axios";

export const Login = () => {
  const [name, setName] = useState("Karen");
  const [pass, setPass] = useState("karen_admin");
  const [error, setError] = useState("");
  const [disabled, setDisabled] = useState(false);

  const handelLogin = (e) => {
    e.preventDefault();
    getUser();
  }

  const getUser = () => {
    setDisabled(true);
    axios.get(`api/login?name=${name}&pass=${pass}`).then(res => {
      console.log(res.data);
      // save user global
      // redirect 
      // save data to local host 
      return res;
    }).catch(err => {
      if(err.response.data?.error){
        setError(err.response.data.error)
      }else{
        setError("unknown error")
      }
      return err;
    }).finally(()=>{
      setDisabled(false);
    })
  }
  return (
    <div>
      <h2>Login</h2>
      {error && <p>{error}</p>}
      <form onSubmit={handelLogin}  >
        <input value={name} onChange={e => { setName(e.target.value) }} type="text" name="name" placeholder="userName" />
        <input value={pass} onChange={e => { setPass(e.target.value) }} type="password" name="pass" placeholder="pass" />
        <input type="submit" value="LOGIN" disabled = {disabled}  />
      </form>
    </div>
  )
}