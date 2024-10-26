const startNewSession = async (req, res, next) => {
  try {
    const { schoolCode } = req.params;
    const classesList = JSON.parse(req.query.classesList);
    const year = getDate().year;

    const school = await School.findOne({ schoolCode }).populate({
      path: "course2",
      populate: {
        path: "groups",
        populate: {
          path: "sections",
          populate: {
            path: "students",
          },
        },
      },
    });

    const course = school.course2;
    const tempCourse = JSON.parse(JSON.stringify(course));

    if (!school || !course) {
      throw new Error("School or Course not found");
    }

    for (const crc of school.course) {
      const crcIdStr = crc._id.toString();

      // First time session is going to be started
      if (classesList.includes(crcIdStr) && !tempCourse.some(crc2 => crc2.courseId.toString() === crcIdStr)) {
        await createSectionsAndGroups(crc, schoolCode);
      } else if (!classesList.includes(crcIdStr)) {
        continue;
      }

      // Promote students to next class if applicable
      if (crc.next) {
        await promoteStudentsToNextClass(school, tempCourse, crc, crcIdStr, schoolCode);
      }

      // Handle students in the last class without a next class
      if (!crc.next) {
        await handleLastClassStudents(school, tempCourse, crc, crcIdStr, year);
      }

      // Handle the case for the first class (e.g., Nursery)
      if (!school.course.some(abc => abc.next && abc.next.toString() === crc._id.toString()) && tempCourse.some(crc2 => crc2.courseId.toString() === crcIdStr)) {
        await createSectionsAndGroups(crc, schoolCode);
      }
    }

    await school.save();
    next();
  } catch (e) {
    console.error(e);
    return res.status(500).send({
      success: false,
      status: "New Session failed to start",
      message: e.message,
    });
  }
};

const createSectionsAndGroups = async (crc, schoolCode) => {
  const sections = await Promise.all(
    crc.groups.flatMap(group =>
      Promise.all(
        group.sections.map(async section => {
          const newExam = new Exam({ schoolCode, term: [] });
          await newExam.save();

          const newSection = new SectionNew({
            name: section.name,
            exam: newExam._id,
            schoolCode,
            sectionId: section._id.toString(),
            subjects: section.subjects.map(subject => ({
              subject: subject.subject,
              teacher: subject.teacher._id,
            })),
          });
          await newSection.save();
          return newSection._id;
        })
      )
    )
  );

  const groups = await Promise.all(
    crc.groups.map(async (group, index) => {
      const newGroup = new GroupNew({
        schoolCode,
        name: group.name,
        subjects: group.subjects,
        sections: sections[index],
        groupId: group._id.toString(),
      });
      await newGroup.save();
      return newGroup._id;
    })
  );

  const newCourse = new CourseNew({
    schoolCode,
    class: crc.class,
    seatsAvailable: crc.seatsAvailable,
    subjects: crc.subjects,
    groups: groups,
    fees: crc.fees,
    next: crc.next,
    courseId: crc._id.toString(),
  });

  const savedCourse = await newCourse.save();
  school.course2.push(savedCourse._id);
};

const promoteStudentsToNextClass = async (school, tempCourse, crc, crcIdStr, schoolCode) => {
  const nextClass = school.course.find(crc2 => crc2._id.toString() === crc.next.toString());
  const thatClass = tempCourse.find(crc2 => crc2.courseId.toString() === crcIdStr);

  if (nextClass) {
    const { sections, groups } = await createNextClassSectionsAndGroups(nextClass, schoolCode);

    const newCourse = new CourseNew({
      schoolCode,
      class: nextClass.class,
      seatsAvailable: nextClass.seatsAvailable,
      subjects: nextClass.subjects,
      groups: groups.map(grp => grp._id),
      fees: nextClass.fees,
      next: nextClass.next,
      courseId: nextClass._id.toString(),
    });

    const savedCourse = await newCourse.save();
    school.course2.push(savedCourse._id);

    // Remove the course from school.course2
    school.course2 = school.course2.filter(el => el._id.toString() !== thatClass._id.toString());
    await promoteStudents(school, thatClass, sections, groups, savedCourse._id);
  }
};

const createNextClassSectionsAndGroups = async (nextClass, schoolCode) => {
  const sections = await Promise.all(
    nextClass.groups.flatMap(group =>
      Promise.all(
        group.sections.map(async section => {
          const newExam = new Exam({ schoolCode, term: [] });
          await newExam.save();

          const newSection = new SectionNew({
            name: section.name,
            exam: newExam._id,
            schoolCode,
            students: [],
            sectionId: section._id.toString(),
            subjects: section.subjects.map(subject => ({
              subject: subject.subject,
              teacher: subject.teacher._id,
            })),
          });
          await newSection.save();
          return newSection;
        })
      )
    )
  );

  const groups = await Promise.all(
    nextClass.groups.map(async (group, index) => {
      const newGroup = new GroupNew({
        schoolCode,
        name: group.name,
        subjects: group.subjects,
        sections: sections[index]._id,
        groupId: group._id.toString(),
      });
      await newGroup.save();
      return newGroup;
    })
  );

  return { sections, groups };
};

const promoteStudents = async (school, thatClass, sections, groups, newCourseId) => {
  for (const group1 of thatClass.groups) {
    for (const section1 of group1.sections) {
      const studentsOfThatSection = await Promise.all(
        section1.students.map(async std => {
          const correspondingStudent = await StudentNew.findById(std._id);
          const newSession = createNewSessionData(school, correspondingStudent, newCourseId);

          correspondingStudent.session.unshift(newSession);
          await StudentNew.findOneAndUpdate(
            { studentId: correspondingStudent._id, schoolCode },
            { $push: { session: correspondingStudent.session[0] } }
          );

          const studentInSchool = school.students.find(student => student._id.toString() === std._id.toString());
          if (studentInSchool) {
            studentInSchool.course = {
              class: newCourseId,
              group: groups.find(grp => grp.name === group1.name)._id,
              section: sections.find(sec => sec.name === section1.name)._id,
            };
          }

          return correspondingStudent;
        })
      );

      await SectionNew.findByIdAndUpdate(
        sections.find(sec => sec.name === section1.name)._id,
        {
          $set: {
            students: studentsOfThatSection.map(ind => ind._id),
          },
        }
      );
    }
  }
};

const createNewSessionData = (school, correspondingStudent, newCourseId) => {
  const newSession = {
    courseId: newCourseId,
    absentDays: [],
    discount: [],
    fine: [],
    previousLeft: 200,
    paymentHistory: [],
    library: [],
    bus: [],
  };

  if (correspondingStudent.session[0].bus.length > 0 && !correspondingStudent.session[0].bus[0]?.end) {
    newSession.bus.unshift({
      place: correspondingStudent.session[0].bus[0]?.place,
      start: getDate().fullDate,
    });
  }

  newSession.library = correspondingStudent.session[0].library.filter(lib => !lib.returnedDate);
  newSession.previousLeft = calculateStudentFee(
    thatClass.fees,
    school.busFee,
    correspondingStudent.session[0],
    thatClass.startDate
  );

  return newSession;
};

const handleLastClassStudents = async (school, tempCourse, crc, crcIdStr, year) => {
  await Promise.all(
    tempCourse.map(async (crc2, index) => {
      if (crc2.courseId.toString() === crc._id.toString()) {
        const allStudents = extractStudents(tempCourse[index]);
        const studentsToDelete = school.students.filter(stu => allStudents.some(stu2 => stu2.toString() === stu._id.toString()));

        await OlderData.findOneAndUpdate(
          { schoolCode, year },
          {
            $push: {
              students: { $each: studentsToDelete },
              courses: crc2._id,
            },
          },
          { new: true, upsert: true }
        );

        school.students = school.students.filter(stu => !allStudents.some(stu2 => stu2.toString() === stu._id.toString()));
        school.course2 = school.course2.filter(el => el._id.toString() !== crc2._id.toString());
      }
    })
  );
};

const extractStudents = (course) => {
  return course.groups.flatMap(group =>
    group.sections.flatMap(section => section.students.map(student => student._id))
  );
};