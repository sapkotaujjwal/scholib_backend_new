const { School, OlderData } = require("../schemas/schoolSchema");
const { getDate } = require("../config/nepaliDate");
const { calculateStudentFee } = require("../config/studentCalc");
const Exam = require("../schemas/examSchema");

const mongoose = require("mongoose");

const {
  CourseNew,
  GroupNew,
  SectionNew,
  StudentNew,
} = require("../schemas/courseSchema");

const startNewSession = async (req, res, next) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const { schoolCode } = req.params;
    const classesList1 = JSON.parse(req.query.classesList);
    const year = getDate().year;

    const school = await School.findOne({ schoolCode })
      .populate({
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
      })
      .session(session);

    const course = school.course2;
    const tempCourse = JSON.parse(JSON.stringify(course));

    function getClassesChain(startingCourseIds, allCourses) {
      allCourses = allCourses.map((each) => {
        return {
          _id: each._id.toString(),
          next: each.next,
        };
      });

      const findCourseById = (id) =>
        allCourses.find((course) => course._id === id || course.id === id);

      function getCompleteChain(startCourse) {
        const chain = [];
        let current = startCourse;

        while (current) {
          chain.push(current._id || current.id);
          if (!current.next) break;
          current = findCourseById(current.next);
        }

        return chain;
      }

      function getBackwardChain(startCourse) {
        const chain = [];
        let current = startCourse;

        while (true) {
          const prevCourse = allCourses.find(
            (course) =>
              (course._id || course.id) !== (current._id || current.id) &&
              course.next === (current._id || current.id)
          );
          if (!prevCourse) break;
          chain.unshift(prevCourse._id || prevCourse.id);
          current = prevCourse;
        }

        return chain;
      }

      const chains = new Set();
      const unconnectedIds = new Set();

      startingCourseIds.forEach((startId) => {
        const startCourse = findCourseById(startId);
        if (!startCourse) {
          unconnectedIds.add(startId);
          return;
        }

        const forwardChain = getCompleteChain(startCourse);
        const backwardChain = getBackwardChain(startCourse);
        const fullChain = [...backwardChain, ...forwardChain];

        chains.add(fullChain.join(","));
      });

      const result = [...chains].map((chain) => chain.split(","));

      if (unconnectedIds.size > 0) {
        result.push([...unconnectedIds]);
      }

      return result;
    }

    const classesChain = getClassesChain(classesList1, school.course);
    const classesList = classesChain.flat();

    if (!school || !course) {
      throw new Error("School or Course not found");
    }

    {
      // olderData Job Starts here

      const studentsToAdd = school.students.filter((std) => {
        const thatCourse = tempCourse.find(
          (crc) => crc._id.toString() === std.course.class.toString()
        );
        if (!thatCourse) {
          throw new Error(
            "Course not found for that student with _id : " + std._id
          );
        }

        if (classesList.includes(thatCourse.courseId)) {
          return std;
        }
      });

      const coursesToAdd = school.course2.filter((crc) => {
        const thatCourse = tempCourse.find(
          (crc2) => crc2._id.toString() === crc._id.toString()
        );

        if (!thatCourse) {
          throw new Error(" : Course not found");
        }

        if (classesList.includes(thatCourse.courseId)) {
          return crc._id;
        }
      });

      if (coursesToAdd.length > 0) {
        const olderData = await OlderData.findOneAndUpdate(
          { schoolCode, year },
          {
            $push: {
              students: { $each: studentsToAdd },
              courses: coursesToAdd,
            },
          },
          {
            new: true,
            upsert: true,
            includeResultMetadata: true,
            session,
          }
        );

        if (olderData && olderData.lastErrorObject.upserted) {
          school.olderData.unshift(olderData.value);
        }
      }

      // olderData Job Ends here
    }

    for (const crc of school.course) {
      const crcIdStr = crc._id.toString();

      if (
        classesList.includes(crcIdStr) &&
        !tempCourse.find((crc2) => crc2.courseId.toString() === crcIdStr)
      ) {
        const sections = await Promise.all(
          crc.groups.map(async (group) =>
            Promise.all(
              group.sections.map(async (section) => {
                const newExam = new Exam({
                  schoolCode,
                  term: [],
                });
                await newExam.save({ session });

                const newSection = new SectionNew({
                  name: section.name,
                  exam: newExam._id,
                  schoolCode,
                  sectionId: section._id.toString(),
                  subjects: section.subjects.map((subject) => ({
                    subject: subject.subject,
                    teacher: subject.teacher._id,
                  })),
                });
                await newSection.save({ session });
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
            await newGroup.save({ session });
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

        let savedCourse = await newCourse.save({ session });
        school.course2.push(savedCourse._id);
        continue;
      } else if (!classesList.includes(crcIdStr)) {
        continue;
      }

      if (crc.next) {
        let nextClass = JSON.parse(
          JSON.stringify(
            school.course.find(
              (crc2) => crc2._id.toString() === crc.next.toString()
            )
          )
        );

        let thatClass = tempCourse.find(
          (crc2) => crc2.courseId.toString() === crcIdStr
        );

        if (nextClass) {
          let sections;
          let groups;
          let newCourse;
          {
            sections = await Promise.all(
              nextClass.groups.flatMap((group) =>
                group.sections.map(async (section) => {
                  const newExam = new Exam({
                    schoolCode,
                    term: [],
                  });
                  await newExam.save({ session });

                  const newSection = new SectionNew({
                    name: section.name,
                    exam: newExam._id,
                    schoolCode,
                    students: [],
                    sectionId: section._id.toString(),
                    subjects: section.subjects.map((subject) => ({
                      subject: subject.subject,
                      teacher: subject.teacher?._id ?? null,
                    })),
                  });
                  await newSection.save({ session });
                  return newSection;
                })
              )
            );

            groups = await Promise.all(
              nextClass.groups.map(async (group, index) => {
                const newGroup = new GroupNew({
                  schoolCode,
                  name: group.name,
                  subjects: group.subjects,
                  sections: sections[index]._id,
                  groupId: group._id.toString(),
                });
                await newGroup.save({ session });
                return newGroup;
              })
            );

            newCourse = new CourseNew({
              schoolCode,
              class: nextClass.class,
              seatsAvailable: nextClass.seatsAvailable,
              subjects: nextClass.subjects,
              groups: groups.map((grp) => grp._id),
              fees: nextClass.fees,
              next: nextClass.next,
              courseId: nextClass._id.toString(),
            });

            let savedCourse = await newCourse.save({ session });
            school.course2.push(savedCourse._id);

            school.course2 = school.course2.filter(
              (el) => el._id.toString() !== thatClass._id.toString()
            );
          }

          for (const group1 of thatClass.groups) {
            for (const section1 of group1.sections) {
              const studnetsOfThatSection = section1.students.map((std) => {
                const correspondingStudent = std;

                {
                  let newSession = {
                    courseId: newCourse._id,
                    absentDays: [],
                    discount: [],
                    fine: [],
                    previousLeft: 0,
                    paymentHistory: [],
                    library: [],
                    bus: [],
                  };

                  if (
                    correspondingStudent.session[0].bus.length > 0 &&
                    !correspondingStudent.session[0].bus[0]?.end
                  ) {
                    newSession.bus.unshift({
                      place: correspondingStudent.session[0].bus[0]?.place,
                      start: getDate().fullDate,
                    });
                  }

                  newSession.library =
                    correspondingStudent.session[0].library.filter(
                      (lib) => !lib.returnedDate
                    );

                  newSession.previousLeft = calculateStudentFee(
                    thatClass.fees,
                    school.busFee,
                    correspondingStudent.session[0],
                    thatClass.startDate
                  );

                  correspondingStudent.session.unshift(newSession);

                  const studentInSchool = school.students.find(
                    (student) => student._id.toString() === std._id.toString()
                  );

                  if (studentInSchool) {
                    studentInSchool.course = {
                      class: newCourse._id,
                      group: groups.find((grp) => grp.name === group1.name)._id,
                      section: sections.find(
                        (sec) => sec.name === section1.name
                      )._id,
                    };
                  }
                }

                return correspondingStudent;
              });

              await Promise.all(
                studnetsOfThatSection.map(async (std) => {
                  // Adds the new session to the first index

                  await StudentNew.findOneAndUpdate(
                    { studentId: std._id, schoolCode },
                    {
                      $push: {
                        session: {
                          $each: [std.session[0]],
                          $position: 0,
                        },
                      },
                    },
                    { session }
                  );
                })
              );

              await SectionNew.findByIdAndUpdate(
                sections.find((sec) => sec.name === section1.name)._id,
                {
                  $set: {
                    students: studnetsOfThatSection.map((ind) => ind._id),
                  },
                },
                { session }
              );
            }
          }
        }
      }

      if (!crc.next) {
        await Promise.all(
          tempCourse.map(async (crc2, index) => {
            if (crc2.courseId.toString() === crc._id.toString()) {
              function extractStudents(a) {
                let studentsArray = a.groups.flatMap((grp) =>
                  grp.sections.flatMap((sec) =>
                    sec.students.map((std) => std.studentId)
                  )
                );

                return studentsArray;
              }

              const allStudents = extractStudents(tempCourse[index]);

              const studentsToDelete = school.students.filter((stu) =>
                allStudents.some(
                  (stu2) => stu2.toString() === stu._id.toString()
                )
              );

              await Promise.all(
                studentsToDelete.map((student) =>
                  StudentNew.findOneAndUpdate(
                    { schoolCode, _id: student._id },
                    { $set: { removedOn: getDate().fullDate } },
                    { session }
                  )
                )
              );

              school.students = school.students.filter(
                (stu) =>
                  !allStudents.some(
                    (stu2) => stu2.toString() === stu._id.toString()
                  )
              );

              school.course2 = school.course2.filter(
                (el) => el._id.toString() !== crc2._id.toString()
              );
            }
          })
        );
      }

      if (
        !school.course.find(
          (abc) => abc.next && abc.next.toString() === crc._id.toString()
        ) &&
        tempCourse.find((crc2) => crc2.courseId.toString() === crcIdStr)
      ) {
        {
          const sections = await Promise.all(
            crc.groups.map(async (group) =>
              Promise.all(
                group.sections.map(async (section) => {
                  const newExam = new Exam({
                    schoolCode,
                    term: [],
                  });
                  await newExam.save({ session });

                  const newSection = new SectionNew({
                    name: section.name,
                    exam: newExam._id,
                    schoolCode,
                    sectionId: section._id.toString(),
                    subjects: section.subjects.map((subject) => ({
                      subject: subject.subject,
                      teacher: subject.teacher._id,
                    })),
                  });
                  await newSection.save({ session });
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
              await newGroup.save({ session });
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

          let savedCourse = await newCourse.save({ session });
          school.course2.push(savedCourse._id);
        }
      }
    }

    await school.save({ session });

    // throw new Error("Not Wanting To Save Currently");
    await session.commitTransaction();

    next();
  } catch (e) {
    await session.abortTransaction();
    console.log(e);
    return res.status(500).send({
      success: false,
      status: "New Session failed to start",
      message: e.message,
    });
  } finally {
    session.endSession();
  }
};

module.exports = { startNewSession };
