import { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";
import ListToDoLists from "./components/ListToDoLists"
import ToDoList from "./components/ToDoList";


function App() {
  const [listSummaries, setListSummaries] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    reloadData().catch(console.error);
  }
    , []);

  async function reloadData() {
    const response = await axios.get("/api/lists");
    const data = await response.data;
    setListSummaries(data);
  }

  function handleNewToDoList(newName) {
    const updateData = async () => {
      const newListData = {
        name: newName,
      }

      await axios.post("/api/lists/", newListData);
      reloadData().catch(console.eerror);
    }
    updateData();
  }

  function handleDeleteToDoList(id) {
    const updateData = async () => {
      await axios.delete(`/api/lists/${id}`);
      reloadData().catch(console.error);
    }
    updateData();
  }


  function handleSelectToDoList(id) {
    console.log("Selected list id: ", id);
    setSelectedItem(id);
  }

  function backToList() {
    setSelectedItem(null);
    reloadData().catch(console.error);
  }

  if (selectedItem === null) {
    return (
      <div className="App">
        <h1>To Do List</h1>
        <ListToDoLists
          listSummaries={listSummaries}
          handleSelectList={handleSelectToDoList}
          handleNewToDoList={handleNewToDoList} // Asegúrate de que esta línea esté presente
          handleDeleteToDoList={handleDeleteToDoList}
        />
      </div>
    );
  } else {
    return (
      <div className="App">
        <h1>To Do List</h1>
        <ToDoList
          listId={selectedItem}
          handleBackButton={backToList}
        />
      </div>
    );
  }




}

export default App;