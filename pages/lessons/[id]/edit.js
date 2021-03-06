import React from 'react'
import Head from 'next/head'
import LessonEdit from '../../../components/lesson/edit/'
import requirePageAuth from '../../../libs/middlewares/requirePageAuth'
import fetchLessonAsProps from '../../../libs/middlewares/fetchLessonAsProps'
import Footer from '../../../components/footer'
import { LessonEditorProvider } from '../../../libs/contexts/lessonEditorContext'

const Page = ({ lesson }) => {
  return (
    <>
      <Head>
        <title>{lesson.title}の編集 - TERACONNECT</title>
      </Head>
      <LessonEditorProvider>
        <LessonEdit lesson={lesson} />
      </LessonEditorProvider>
      <Footer />
    </>
  )
}

export default Page

export async function getServerSideProps(context) {
  const authProps = await requirePageAuth(context)
  return fetchLessonAsProps(context, authProps.props)
}