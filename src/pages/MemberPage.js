import { useState, useEffect } from "react";
import operation from "./../api";

const ListMembers = (props) => {
  const { members } = props;
  return members.map((member) => {
    return (
      <div key={member.id}>
        <p>
          {member.fullname} {member.email}
        </p>
      </div>
    );
  });
};

const FormMember = () => {
  const handleOnChange = (event, setter) => {
    const { value } = event.target;
    setter(value);
  };

  const [fullname, setFullname] = useState("");
  const [email, setEmail] = useState("");

  return (
    <>
      <div>
        <input
          value={fullname}
          onChange={(event) => handleOnChange(event, setFullname)}
          placeholder={"fullname"}
        />
      </div>

      <div>
        <input
          value={email}
          onChange={(event) => handleOnChange(event, setEmail)}
          placeholder={"email"}
        />
      </div>

      <button
        onClick={() => {
          const data = { fullname, email };
          operation.addMember(data);
        }}
      >
        Add Member
      </button>
    </>
  );
};

const MemberPage = () => {
  const [members, setMembers] = useState([]);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    try {
      operation.getMembersListRealtime(setMembers);
      setIsError(false);
    } catch (error) {
      setIsError(true);
    }
  }, []);

  return (
    <>
      <div className="App">
        <p>Member Page</p>
        <FormMember />
      </div>

      <p>Member Lists</p>
      <div>{isError && <p>Error, have you logged in already ?</p>}</div>
      <div>{!isError && <ListMembers members={members} />}</div>
      
      <div>
        <p>Login Admin</p>
        <button
          onClick={async () => {
            await operation.loginEmailAndPassword(
              "smith@email.com",
              "smith@email.com"
            );
            operation.getMembersListRealtime(setMembers);
          }}
        >
          Login as Admin
        </button>
      </div>
    </>
  );
};

export default MemberPage;
