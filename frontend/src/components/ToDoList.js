import "./ToDoList.css"
import { useEffect, useState, useRef } from "react"
import axios from "axios"
import { BiSolidTrash } from "react-icons/bi"

function ToDoList({ listId, handleBackButton }) {
    let labelRef = useRef();
    const [listData, setListData] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            const response = await axios.get(`/api/lists/${listId}`);
            const newData = await response.data;

            setListData(newData);
        };
        fetchData();
    }, [listId]);

    function handleCreateItem(label) {
        const updateData = async () => {
            const response = await axios.post(`/api/lists/${listData.id}/items`, {
                label: label,
            });
            setListData(await response.data);
        };
        updateData();
    }

    function handleDeleteItem(itemId) {
        const updateData = async () => {
            const response = await axios.delete(`/api/lists/${listData.id}/items/${itemId}`);
            setListData(await response.data);
        };
        updateData();
    }

    function handleCheckToggle(itemId, newState) {
        const updateData = async () => {
            const response = await axios.patch(`/api/lists/${listData.id}/checked_state`, {
                checked_state: newState,
                item_id: itemId,
            });
            setListData(await response.data);
        };
        updateData();
    }

    if (listData === null) {
        return (
            <div className="ToDoList loading">
                <button className="back" onClick={handleBackButton}>Back</button>
                Loading...</div>
        );
    }
    return (
        <div className="ToDoList">
            <button className="back" onClick={handleBackButton}>Back</button>
            <h1>List {listData.name}</h1>
            <div className="box">
                <label>
                    New Item: &nbsp;
                    <input id={labelRef} type="text" />
                </label>
                <button onClick={() => handleCreateItem(document.getElementById(labelRef))}>New</button>
            </div>
            {listData.items.length > 0 ? (
                listData.items.map((item) => {
                    return (
                        <div key={item.id} className={item.checked ? "item checked" : "item"}
                            onClick={() => handleCheckToggle(item.id, !item.checked)}>
                            <span>{item.checked ? "" : ""}</span>
                            <span className="label">{item.label}</span>
                            <span className="flex"></span>
                            <span className="trash" onClick={(evt) => {
                                evt.stopPropagation();
                                handleDeleteItem(item.id);
                            }}
                            >
                                <BiSolidTrash />
                            </span>
                        </div>
                    );
                }
                )
            ) : (
                <div className="box">There are currently no items.</div>
            )}

        </div >
    )


}