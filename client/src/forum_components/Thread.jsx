import React, { useState, useEffect } from 'react'
import { Card, Button, Col, Row } from 'antd'
import { Link } from 'react-router-dom'
import requester from '../helpers/requester'

export default ({ currentPath, threadId }) => {
  const [posts, setPosts] = useState([])

  const postRoute = useEffect(() => {
    requester.get(`forum/threads/${threadId}/posts`).then(posts => {
      setPosts(posts)
    })
  }, [threadId])

  return (
    <>
      <Card
        title={
          <Row>
            <Col span={6} />
            <Col span={12}>
              <Link to={`${currentPath}/New Post`} />
              <Button type="primary" block>
                Create Post
              </Button>
            </Col>
            <Col span={6} />
          </Row>
        }
      >
        Posts
      </Card>
    </>
  )
}
