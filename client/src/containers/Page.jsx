import React from 'react'
import { Layout } from 'antd'
import Nav from '../components/Nav'

export default ({ children, selected }) => {
  return (
    <Layout>
      <Nav selected={selected}></Nav>
      <Layout style={{ padding: '10px' }}>{children}</Layout>
    </Layout>
  )
}
