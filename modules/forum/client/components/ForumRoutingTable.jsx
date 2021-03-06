import React, { useState } from "react";
import { DeleteOutlined } from "@ant-design/icons";
import { Button, Row, Col, Collapse, Input, Empty } from "antd";
import HTML5Backend from "react-dnd-html5-backend";
import { DndProvider, DragSource, DropTarget } from "react-dnd";

export default ({ categories, onChange, onCreateCategory }) => {
  const forumInput = React.createRef();
  let dragingIndex = -1;

  const handleDelete = (categoryIndex, threadIndex) => {
    const newItems = Array.from(categories);
    if (!isNaN(threadIndex)) {
      newItems[categoryIndex].threads.splice(threadIndex, 1);
    } else {
      newItems.splice(categoryIndex, 1);
    }

    // Remove activekey if exists
    const activeKeyIndex = defaultActiveKeys.indexOf(threadIndex + 1);
    if (activeKeyIndex !== -1) {
      delete defaultActiveKeys[activeKeyIndex];
    }
    onChange(newItems);
  };

  const handleCreateThread = () => {
    if (!forumInput.current.state.value) return;

    const newItems = Array.from(categories);
    newItems.map((item) => {
      if (item.title === "Uncategorized") {
        item.threads.push({
          title: forumInput.current.state.value,
        });
      }

      return item;
    });

    forumInput.current.state.value = "";

    onChange(newItems);
  };

  const handleCreateCategory = () => {
    if (!forumInput.current.state.value) return;

    onCreateCategory({
      title: forumInput.current.state.value,
      order: categories.length + 1,
      threads: [],
    });
    forumInput.current.state.value = "";
  };

  const Thread = ({
    categoryIndex,
    threadIndex,
    title,
    isOver,
    connectDragSource,
    connectDropTarget,
    moveRow,
    ...restProps
  }) => {
    let { className } = restProps;
    if (isOver) {
      if (threadIndex > dragingIndex) {
        className += " oddity-dnd-downward";
      }
      if (threadIndex < dragingIndex) {
        className += " oddity-dnd-upward";
      }
    }

    return connectDragSource(
      connectDropTarget(
        <div index={threadIndex} thread="true" className={className}>
          {title}
          <div
            onClick={() => handleDelete(categoryIndex, threadIndex)}
            className="oddity-collapse-delete"
          >
            <DeleteOutlined />
          </div>
        </div>
      )
    );
  };

  const ThreadDnD = DropTarget(
    "thread",
    {
      drop(props, monitor) {
        const sourceCategoryIndex = monitor.getItem().categoryIndex;
        const sourceThreadIndex = monitor.getItem().threadIndex;

        const targetCategoryIndex = props.categoryIndex;
        const targetThreadIndex = props.threadIndex;

        // if NOT same category return
        if (sourceCategoryIndex !== targetCategoryIndex) {
          return;
        }

        // if same thread return
        if (sourceThreadIndex === targetThreadIndex) {
          return;
        }

        // Time to actually perform the action
        const newItems = Array.from(categories);

        const temp = newItems[sourceCategoryIndex].threads[sourceThreadIndex];

        newItems[sourceCategoryIndex].threads[sourceThreadIndex] =
          newItems[sourceCategoryIndex].threads[targetThreadIndex];

        newItems[sourceCategoryIndex].threads[targetThreadIndex] = temp;

        onChange(newItems);

        // Note: we're mutating the monitor item here!
        // Generally it's better to avoid mutations,
        // but it's good here for the sake of performance
        // to avoid expensive index searches.
        monitor.getItem().threadIndex = targetThreadIndex;
      },
    },
    (connect, monitor) => ({
      connectDropTarget: connect.dropTarget(),
      isOver: monitor.isOver(),
    })
  )(
    DragSource(
      "thread",
      {
        beginDrag(props) {
          dragingIndex = props.index;
          return {
            categoryIndex: props.categoryIndex,
            threadIndex: props.threadIndex,
          };
        },
      },
      (connect) => ({
        connectDragSource: connect.dragSource(),
      })
    )(Thread)
  );

  const Category = ({
    index,
    title,
    isOver,
    itemType,
    connectDragSource,
    connectDropTarget,
    moveRow,
    ...restProps
  }) => {
    let { className } = restProps;
    if (isOver) {
      if (itemType === "thread") {
        className += " oddity-dnd-select";
      } else {
        if (index > dragingIndex) {
          className += " oddity-dnd-downward";
        }
        if (index < dragingIndex) {
          className += " oddity-dnd-upward";
        }
      }
    }

    if (title === "Uncategorized") {
      return (
        <div index={index} className="oddity-collapsable-disabled-header">
          {title}
        </div>
      );
    }

    return connectDragSource(
      connectDropTarget(
        <div index={index} className={className}>
          {title}

          <div
            onClick={() => handleDelete(index)}
            className="oddity-collapse-delete"
          >
            <DeleteOutlined />
          </div>
        </div>
      )
    );
  };

  const CategoryDnD = DropTarget(
    ["category", "thread"],
    {
      drop(props, monitor) {
        const newItems = Array.from(categories);
        if (monitor.getItemType() === "thread") {
          const categoryIndex = monitor.getItem().categoryIndex;
          const threadIndex = monitor.getItem().threadIndex;

          // make sure its not the same category
          if (categoryIndex === props.index) {
            return;
          }

          // if dropping a thread
          const temp = newItems[categoryIndex].threads[threadIndex]; // save value temporarly
          newItems[categoryIndex].threads.splice(threadIndex, 1); // remove from old category
          newItems[props.index].threads.push(temp); // add to new category
        } else {
          const hoverIndex = props.index;
          const dragIndex = monitor.getItem().index;

          // Don't replace items with themselves
          if (dragIndex === hoverIndex) {
            return;
          }
          // if sorting a category
          const temp = newItems[hoverIndex];
          newItems[hoverIndex] = newItems[dragIndex];
          newItems[dragIndex] = temp;

          // Note: we're mutating the monitor item here!
          // Generally it's better to avoid mutations,
          // but it's good here for the sake of performance
          // to avoid expensive index searches.
          monitor.getItem().index = hoverIndex;
        }

        onChange(newItems);
      },
    },
    (connect, monitor) => {
      return {
        connectDropTarget: connect.dropTarget(),
        itemType: monitor.getItemType(),
        isOver: monitor.isOver(),
      };
    }
  )(
    DragSource(
      "category",
      {
        beginDrag(props) {
          dragingIndex = props.index;
          return {
            index: props.index,
          };
        },
      },
      (connect) => ({
        connectDragSource: connect.dragSource(),
      })
    )(Category)
  );

  const uncategorizedIndex = categories.findIndex(
    (item) => item.title === "Uncategorized"
  );

  const defaultActiveKeys = [uncategorizedIndex + 1];
  if (categories.length < 10) {
    for (let i = 1; i < categories.length; i++) {
      if (categories[i].threads.length > 0) defaultActiveKeys.push(i + 1);
    }
  }
  return (
    <>
      <Input ref={forumInput} placeholder="Title" />
      <Row style={{ marginBottom: "30px" }}>
        <Col span={12}>
          <Button onClick={handleCreateCategory} type="primary" block>
            Create Category
          </Button>
        </Col>
        <Col span={12}>
          <Button onClick={handleCreateThread} block>
            Create Thread
          </Button>
        </Col>
      </Row>
      {categories.length === 0 ||
      (categories.length === 1 && categories[0].title === "Uncategorized") ? (
        <Empty />
      ) : (
        <DndProvider backend={HTML5Backend}>
          <Collapse defaultActiveKey={defaultActiveKeys}>
            {categories.map((item, i) => (
              <Collapse.Panel
                disabled={item.title === "Uncategorized" ? true : false}
                showArrow={item.title === "Uncategorized" ? false : true}
                className="oddity-collapsable-custom"
                header={
                  <CategoryDnD
                    index={i}
                    className="oddity-collapsable-custom-header"
                    title={item.title}
                  />
                }
                key={i + 1}
              >
                {item.threads.map((thread, j) => (
                  <ThreadDnD
                    className="oddity-thread-card"
                    categoryIndex={i}
                    threadIndex={j}
                    index={j}
                    key={j}
                    title={thread.title}
                  />
                ))}
              </Collapse.Panel>
            ))}
          </Collapse>
        </DndProvider>
      )}
    </>
  );
};
