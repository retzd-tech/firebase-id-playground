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

  useEffect(() => {
    operation.getMembersListRealtime(setMembers);
  }, []);

  return (
    <>
    <p>Master branch on Preview</p>
      <div className="App">
        <p>Member Page</p>
        <FormMember/>
      </div>

      <div>
        <p>Member Lists</p>
        <ListMembers members={members} />
      </div>
    </>
  );
};

export default MemberPage;
