package expo.modules.medialibrary

import android.content.ContentResolver
import android.content.Context
import android.database.Cursor
import io.mockk.every
import io.mockk.mockk
import org.robolectric.fakes.RoboCursor

typealias CursorResults = Array<Array<out Any?>>

fun mockCursor(cursorResults: CursorResults): Cursor {
  val cursor = RoboCursor()
  cursor.setColumnNames(MediaLibraryConstants.ASSET_PROJECTION.toMutableList())
  cursor.setResults(cursorResults)
  return cursor
}

fun mockContentResolver(cursor: Cursor?): ContentResolver {
  val contentResolver = mockk<ContentResolver>()
  every { contentResolver.query(
    MediaLibraryConstants.EXTERNAL_CONTENT,
    MediaLibraryConstants.ASSET_PROJECTION,
    any(), any(), any())
  } returns cursor
  return contentResolver
}

fun mockContentResolverForResult(cursorResults: CursorResults)
  = mockContentResolver(mockCursor(cursorResults))

fun throwableContentResolver(throwable: Throwable): ContentResolver {
  val contentResolver = mockk<ContentResolver>()
  every { contentResolver.query(any(), any(), any(), any(),any()) } throws throwable
  return contentResolver
}

class MockContext {
  private val context = mockk<Context>()

  infix fun with(contentResolver: ContentResolver): Context {
    every { context.getContentResolver() } returns contentResolver
    return context
  }

  fun get() = context
}
